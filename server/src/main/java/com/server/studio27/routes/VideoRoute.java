package com.server.studio27.routes;

import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.server.studio27.controllers.HetznerAPIController;
import com.server.studio27.models.SftpStream;
import com.server.studio27.services.EncryptionService;

@RestController
@RequestMapping("/api/video")
public class VideoRoute {

    @Autowired
    private HetznerAPIController hetznerApiService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private com.server.studio27.auth.JwtService jwtService;

    @Autowired
    private com.server.studio27.auth.CustomUserDetailsService customUserDetailsService;

    @GetMapping("/generate-video-token")
    public ResponseEntity<?> generateVideoToken(@RequestParam String videoPath,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Nedostaje JWT token"));
        }

        String email = null;
        try {
            String accessToken = authHeader.substring(7);
            email = jwtService.extractUsername(accessToken);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Nevalidan token"));
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        String videoToken = jwtService.generateValidateVideoToken(videoPath, userDetails);

        return ResponseEntity.ok(Map.of("message", "ok", "user", email, "videoToken", videoToken));
    }

    @GetMapping("/stream")
    public ResponseEntity<StreamingResponseBody> streamVideo(
            @RequestParam String remoteFilePath,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        try {

            long fileSize = hetznerApiService.getFileSize(remoteFilePath);

            long start = 0;
            long end = fileSize - 1;

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
                if (!ranges.isEmpty()) {
                    HttpRange range = ranges.get(0);
                    start = range.getRangeStart(fileSize);
                    end = range.getRangeEnd(fileSize);
                }
            }

            long contentLength = end - start + 1;

            SftpStream sftpStream = hetznerApiService.getVideoStream(remoteFilePath, start);
            InputStream is = sftpStream.inputStream;

            StreamingResponseBody responseBody = outputStream -> {
                byte[] buffer = new byte[1024 * 1024];
                long remaining = contentLength;
                int len;

                try {
                    while (remaining > 0) {
                        try {
                            len = is.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                            if (len == -1) break;
                            outputStream.write(buffer, 0, len);
                            outputStream.flush();
                            remaining -= len;
                        } catch (InterruptedIOException ie) {
                            // client aborted or thread interrupted — stop streaming gracefully
                            System.out.println("Streaming interrupted (client aborted): " + ie.getMessage());
                            break;
                        } catch (IOException io) {
                            // I/O error while reading/writing — log and stop
                            System.err.println("I/O error during streaming: " + io.getMessage());
                            break;
                        }
                    }
                } finally {
                    try {
                        is.close();
                    } catch (IOException ignore) {}
                    try {
                        if (sftpStream.channel != null && sftpStream.channel.isConnected()) sftpStream.channel.exit();
                    } catch (Exception ignore) {}
                    try {
                        if (sftpStream.session != null && sftpStream.session.isConnected()) sftpStream.session.disconnect();
                    } catch (Exception ignore) {}
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("video/mp4"));
            headers.setContentLength(contentLength);
            headers.add("Accept-Ranges", "bytes");
            headers.add("Content-Range",
                    String.format("bytes %d-%d/%d", start, end, fileSize));

            return new ResponseEntity<>(
                    responseBody,
                    headers,
                    rangeHeader != null ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}