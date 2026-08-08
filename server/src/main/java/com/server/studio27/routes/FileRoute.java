package com.server.studio27.routes;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.server.studio27.controllers.HetznerAPIController;
import com.server.studio27.services.SftpDownloadStream;
import com.server.studio27.services.VideoHlsService;
@RestController
@RequestMapping("/api")
public class FileRoute {
    private final String UPLOAD_DIR = "/assets/uploads/";

    @Autowired
    private HetznerAPIController hetznerapiService;

    @Autowired
    private VideoHlsService videoHlsService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/upload-hls-hetzner")
    public ResponseEntity<Map<String, Object>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("lekcijaId") int lekcijaId) throws Exception {
        try {
            String videoId = videoHlsService.convertToHlsAndUpload(file);
            
            String SQL = "INSERT INTO video (url, lekcijaId) VALUES (?, ?);";
            jdbcTemplate.update(SQL, videoId, lekcijaId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Video uspešno konvertovan, postavljen i sacuvan u bazi!");
            response.put("videoId", videoId);
            System.out.println("Video ID: " + videoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Greška prilikom konverzije i postavljanja videa: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/delete-folder")
    public ResponseEntity<Map<String, Object>> deleteFolder(@RequestParam String remoteFolderPath) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<String> files = hetznerapiService.listFilesInFolder(remoteFolderPath);
            for (String file : files) {
                if (".".equals(file) || "..".equals(file)) continue;
                hetznerapiService.deleteFile(remoteFolderPath + "/" + file);
            }
            hetznerapiService.removeFolder(remoteFolderPath);
            response.put("message", "Folder i svi fajlovi su obrisani.");
            response.put("result", "Folder obrisan.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Greška prilikom brisanja foldera: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/upload-local")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file) {

        Map<String, String> response = new HashMap<>();

        try {

            if (file.isEmpty()) {
                response.put("message", "Fajl je prazan!");
                return ResponseEntity.badRequest().body(response);
            }

            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            byte[] bytes = file.getBytes();
            Path path = Paths.get(UPLOAD_DIR + file.getOriginalFilename());
            Files.write(path, bytes);

            response.put("message", "Fajl uspešno postavljen!");
            response.put("filename", file.getOriginalFilename());
            response.put("path", path.toString());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("message", "Greška: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/create-folder")
    public String postMethodName(@RequestParam String path) {
        return hetznerapiService.createFolder(path);
    }

    @PostMapping("/upload-hetzner")
    public ResponseEntity<Map<String, String>> postMethodName(@RequestParam String path,
            @RequestParam MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            hetznerapiService.addFiletoFolder(path, file);
            response.put("message", "Fajl uspešno postavljen na Hetzner!");
        } catch (Exception e) {
            response.put("message", "Greška prilikom postavljanja fajla: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all-files-in-folder")
    public List<String> getAllFilesInFolder(@RequestParam String remoteFolderPath) {
        return hetznerapiService.listFilesInFolder(remoteFolderPath);
    }

    @GetMapping("/media")
    public ResponseEntity<StreamingResponseBody> downloadFile(@RequestParam String remoteFilePath) {
        try {
            SftpDownloadStream sftpStream = hetznerapiService.downloadFileStream(remoteFilePath);

            String filename = remoteFilePath.substring(remoteFilePath.lastIndexOf("/") + 1);
            String contentType = getContentType(filename);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDisposition(ContentDisposition.builder("attachment").filename(filename).build());
            
            // Postavljanje veličine fajla da bi pretraživač prikazao progress bar
            headers.setContentLength(sftpStream.getFileSize());

            StreamingResponseBody responseBody = outputStream -> {
                // Try-with-resources automatski poziva sftpStream.close() na kraju
                try (sftpStream; InputStream is = sftpStream.getInputStream()) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = is.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.flush();
                }
            };

            return ResponseEntity.ok().headers(headers).body(responseBody);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/delete-file")
    public ResponseEntity<String> deleteFile(@RequestParam String remoteFilePath) {
        String result = hetznerapiService.deleteFile(remoteFilePath);
        return ResponseEntity.ok().body(result);
    }

    private String getContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }

}
