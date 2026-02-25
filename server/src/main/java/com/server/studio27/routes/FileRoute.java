package com.server.studio27.routes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.server.studio27.controllers.HetznerAPIController;

@RestController
@RequestMapping("/api")
public class FileRoute {
    private final String UPLOAD_DIR = "/uploads/"; 

    @Autowired
    private HetznerAPIController hetznerapiService;

    @GetMapping("/storage")
    public ResponseEntity<String> getStorageBoxes(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String label_selector,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "25") Integer per_page) {

        String result = hetznerapiService.getStorageBoxes(
                name,
                label_selector,
                sort,
                page,
                per_page);

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(result);
    }

    @GetMapping("/storage/{id}")
    public ResponseEntity<String> getStorageBoxFolders(
            @PathVariable Long id,
            @RequestParam(defaultValue = ".") String path) {

        String result = hetznerapiService.getStorageBoxFolders(id);

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(result);
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
    public String postMethodName(@RequestParam String path, @RequestParam MultipartFile file) {
        return hetznerapiService.addFiletoFolder(path, file);
    }

    @GetMapping("/all-files-in-folder")
    public List<String> getAllFilesInFolder(@RequestParam String remoteFolderPath) {
        return hetznerapiService.listFilesInFolder(remoteFolderPath);
    }

    @GetMapping("/media")
    public ResponseEntity<byte[]> downloadFile(@RequestParam String remoteFilePath) {
        byte[] fileData = hetznerapiService.downloadFile(remoteFilePath);
        if (fileData == null || fileData.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        HttpHeaders headers = new HttpHeaders();
        String filename = remoteFilePath.substring(remoteFilePath.lastIndexOf("/") + 1);
        String contentType = "application/octet-stream";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
            contentType = "image/jpeg";
        else if (filename.endsWith(".png"))
            contentType = "image/png";
        else if (filename.endsWith(".mp4"))
            contentType = "video/mp4";
        else if (filename.endsWith(".pdf"))
            contentType = "application/pdf";
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(fileData);
    }

    @DeleteMapping("/delete-file")
    public ResponseEntity<String> deleteFile(@RequestParam String remoteFilePath) {
        String result = hetznerapiService.deleteFile(remoteFilePath);
        return ResponseEntity.ok().body(result);
    }



}
