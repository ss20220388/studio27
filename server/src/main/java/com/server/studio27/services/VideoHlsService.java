package com.server.studio27.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

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
                tempDir.resolve("index.m3u8").toAbsolutePath().toString());

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

        ExecutorService executor = Executors.newFixedThreadPool(6); // npr. 6 thread-ova
        Files.list(tempDir).forEach(path -> {
            executor.submit(() -> {
                try {
                    System.out.println("Uploading: " + path.getFileName());
                    byte[] fileBytes = Files.readAllBytes(path);
                    hetzner.uploadEncryptedFile(
                            remoteFolder,
                            path.getFileName().toString(),
                            fileBytes);
                    System.out.println("Uploaded: " + path.getFileName());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        });
        executor.shutdown();
        executor.awaitTermination(30, TimeUnit.MINUTES);

        try {
            Files.walkFileTree(tempDir, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws java.io.IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, java.io.IOException exc)
                        throws java.io.IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
            System.out.println("Obrisan temp folder: " + tempDir.toString());
        } catch (Exception e) {
            System.err.println("Neuspešno brisanje temp foldera: " + tempDir.toString());
            e.printStackTrace();
        }

        return videoId;
    }
}