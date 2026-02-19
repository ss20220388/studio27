package com.server.studio27.routes;

import java.io.InputStream;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.server.studio27.controllers.HetznerAPIController;
import com.server.studio27.models.SftpStream;

@RestController
@RequestMapping("/api/video")
public class VideoRoute {
    @Autowired
    private HetznerAPIController hetznerApiService;

    @GetMapping("/stream")
    public ResponseEntity<StreamingResponseBody> streamVideo(
            @RequestParam String remotePath,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        try {
            long fileSize = hetznerApiService.getFileSize(remotePath);

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
            SftpStream sftpStream = hetznerApiService.getVideoStream(remotePath, start);
            InputStream is = sftpStream.inputStream;

            StreamingResponseBody responseBody = outputStream -> {
                byte[] buffer = new byte[256 * 1024]; // 256KB buffer
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

}
