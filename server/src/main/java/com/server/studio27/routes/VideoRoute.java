package com.server.studio27.routes;

import java.io.InputStream;
import java.util.HashMap;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
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

    @GetMapping("/stream-protected")
    public ResponseEntity<StreamingResponseBody> streamProtected(
            @RequestParam String remoteFilePath,
            @RequestParam(value = "videoToken", required = true) String videoTokenParam,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        try {
            if (videoTokenParam == null || videoTokenParam.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            if(jwtService.isTokenExpired(videoTokenParam)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            long fileSize = hetznerApiService.getFileSize(remoteFilePath);
            long start = 0;
            long end = fileSize - 1;

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
                if (!ranges.isEmpty()) {
                    HttpRange httpRange = ranges.get(0);
                    start = httpRange.getRangeStart(fileSize);
                    end = httpRange.getRangeEnd(fileSize);
                }
            }

            long contentLength = end - start + 1;
            SftpStream sftpStream = hetznerApiService.getVideoStream(remoteFilePath, start);
            InputStream is = sftpStream.inputStream;

            StreamingResponseBody responseBody = outputStream -> {
                byte[] buffer = new byte[2048 * 1024];
                long bytesToRead = contentLength;
                int len;
                try {
                    while (bytesToRead > 0 &&
                            (len = is.read(buffer, 0, (int) Math.min(buffer.length, bytesToRead))) != -1) {
                        outputStream.write(buffer, 0, len);
                        bytesToRead -= len;
                    }
                } finally {
                    is.close();
                    sftpStream.channel.exit();
                    sftpStream.session.disconnect();
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("video/mp4"));
            headers.setContentLength(contentLength);
            headers.add("Accept-Ranges", "bytes");
            headers.add("Content-Range", String.format("bytes %d-%d/%d", start, end, fileSize));

            return new ResponseEntity<>(responseBody, headers,
                    rangeHeader != null ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
                    HttpRange httpRange = ranges.get(0);
                    start = httpRange.getRangeStart(fileSize);
                    end = httpRange.getRangeEnd(fileSize);
                }
            }

            long contentLength = end - start + 1;
            SftpStream sftpStream = hetznerApiService.getVideoStream(remoteFilePath, start);
            InputStream is = sftpStream.inputStream;

            StreamingResponseBody responseBody = outputStream -> {
                byte[] buffer = new byte[2048 * 1024];
                long bytesToRead = contentLength;
                int len;
                try {
                    while (bytesToRead > 0
                            && (len = is.read(buffer, 0, (int) Math.min(buffer.length, bytesToRead))) != -1) {
                        outputStream.write(buffer, 0, len);
                        bytesToRead -= len;
                    }
                } finally {
                    is.close();
                    sftpStream.channel.exit();
                    sftpStream.session.disconnect();
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("video/mp4"));
            headers.setContentLength(contentLength);
            headers.add("Accept-Ranges", "bytes");
            headers.add("Content-Range", String.format("bytes %d-%d/%d", start, end, fileSize));

            return new ResponseEntity<>(responseBody, headers,
                    rangeHeader != null ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload-encrypted")
    public ResponseEntity<Map<String, String>> uploadEncryptedVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String remoteFolderPath) {

        Map<String, String> response = new HashMap<>();

        try {
            if (file.isEmpty()) {
                response.put("error", "Fajl je prazan!");
                return ResponseEntity.badRequest().body(response);
            }

            byte[] originalData = file.getBytes();
            System.out.println("📄 Original file size: " + originalData.length + " bytes");

            byte[] encryptedData = encryptionService.encrypt(originalData);
            System.out.println("🔐 Encrypted file size: " + encryptedData.length + " bytes");

            String originalFilename = file.getOriginalFilename();
            String encryptedFilename = "encrypted_" + originalFilename + ".enc";

            String path = remoteFolderPath != null ? remoteFolderPath : "/backup";
            String result = hetznerApiService.uploadEncryptedFile(path, encryptedFilename, encryptedData);

            response.put("message", "Video enkriptovan i sačuvan!");
            response.put("original_filename", originalFilename);
            response.put("encrypted_filename", encryptedFilename);
            response.put("path", path);
            response.put("encryption", "AES-256-GCM");
            response.put("status", result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Greška pri enkriptovanju: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/download-encrypted")
    public ResponseEntity<byte[]> downloadEncryptedVideo(
            @RequestParam String remoteFilePath) {

        try {
            byte[] encryptedData = hetznerApiService.downloadFile(remoteFilePath);

            if (encryptedData == null || encryptedData.length == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Fajl nije pronađen".getBytes());
            }

            System.out.println("📥 Downloaded encrypted file: " + encryptedData.length + " bytes");

            byte[] decryptedData = encryptionService.decrypt(encryptedData);
            System.out.println("🔓 Decrypted file: " + decryptedData.length + " bytes");

            String filename = remoteFilePath.substring(remoteFilePath.lastIndexOf("/") + 1);
            filename = filename.replace("encrypted_", "").replace(".enc", "");

            HttpHeaders headers = new HttpHeaders();

            String contentType = "application/octet-stream";
            if (filename.endsWith(".mp4"))
                contentType = "video/mp4";
            else if (filename.endsWith(".avi"))
                contentType = "video/x-msvideo";
            else if (filename.endsWith(".mov"))
                contentType = "video/quicktime";
            else if (filename.endsWith(".mkv"))
                contentType = "video/x-matroska";

            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("inline", filename); // inline za streaming

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(decryptedData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Greška pri dekriptovanju: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/stream-encrypted")
    public ResponseEntity<byte[]> streamEncryptedVideo(
            @RequestParam String remoteFilePath) {

        try {
            byte[] encryptedData = hetznerApiService.downloadFile(remoteFilePath);

            if (encryptedData == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] decryptedData = encryptionService.decrypt(encryptedData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("video/mp4"));
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(decryptedData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
