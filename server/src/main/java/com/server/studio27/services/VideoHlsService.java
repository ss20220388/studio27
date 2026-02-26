package com.server.studio27.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.server.studio27.controllers.HetznerAPIController;

@Service
public class VideoHlsService {

    private final HetznerAPIController hetzner;

    public VideoHlsService(HetznerAPIController hetzner) {
        this.hetzner = hetzner;
    }
    public String convertToHlsAndUpload(MultipartFile file) throws Exception {

        String videoId = UUID.randomUUID().toString();
        Path tempDir = Files.createTempDirectory("hls-" + videoId);

        Path tempVideo = tempDir.resolve("input.mp4");
        Files.write(tempVideo, file.getBytes());

        ProcessBuilder builder = new ProcessBuilder(
                 "C:\\ffmpeg\\bin\\ffmpeg.exe",
                "-i", tempVideo.toAbsolutePath().toString(),
                "-codec", "copy",              
                "-start_number", "0",
                "-hls_time", "10",
                "-hls_list_size", "0",
                "-f", "hls",
                tempDir.resolve("index.m3u8").toAbsolutePath().toString()
        );

        builder.redirectErrorStream(true);
        Process process = builder.start();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg konverzija nije uspela, exit code: " + exitCode);
        }

        String remoteFolder = "/videos/" + videoId;
        hetzner.createFolder(remoteFolder);

        Files.list(tempDir).forEach(path -> {
            try {
                byte[] fileBytes = Files.readAllBytes(path);
                hetzner.uploadEncryptedFile(
                        remoteFolder,
                        path.getFileName().toString(),
                        fileBytes
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        });


        Files.walk(tempDir)
                .sorted((a, b) -> b.compareTo(a))
                .forEach(p -> {
                    try { Files.delete(p); } catch (Exception ignored) {}
                });

        return remoteFolder + "/index.m3u8";
    }
}