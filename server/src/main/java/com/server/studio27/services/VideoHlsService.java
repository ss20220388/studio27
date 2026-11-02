package com.server.studio27.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.server.studio27.controllers.HetznerAPIController;

// Video lekcije: snimak -> HLS (delovi od 10 s) -> šifrovano na Hetzner -> red u tabeli video.
// Obrada ide u pozadini: veliki 4K snimci traju dugo, a admin ne sme da čeka (nginx bi prekinuo zahtev).
// Admin prati stanje preko status(videoId) dok ne bude GOTOVO.
@Service
public class VideoHlsService {

    public enum Stanje { OBRADA, GOTOVO, GRESKA }

    public record Status(Stanje stanje, String poruka) {}

    private final HetznerAPIController hetzner;
    private final JdbcTemplate jdbcTemplate;
    private final Map<String, Status> statusi = new ConcurrentHashMap<>();
    // jedan po jedan video: konverzija 4K snimka je teška za procesor servera
    private final ExecutorService obrada = Executors.newSingleThreadExecutor();

    public VideoHlsService(HetznerAPIController hetzner, JdbcTemplate jdbcTemplate) {
        this.hetzner = hetzner;
        this.jdbcTemplate = jdbcTemplate;
    }

    private static String alat(String ime) {
        return System.getProperty("os.name").toLowerCase().contains("win") ? "C:\\ffmpeg\\bin\\" + ime + ".exe" : ime;
    }

    // Prima snimak (na disk, ne u memoriju) i pokreće obradu u pozadini; vraća videoId odmah
    public String primiZaLekciju(MultipartFile file, int lekcijaId) throws Exception {
        String videoId = UUID.randomUUID().toString();
        Path folder = Files.createTempDirectory("hls-" + videoId);
        Path ulaz = folder.resolve("ulaz");
        file.transferTo(ulaz);
        statusi.put(videoId, new Status(Stanje.OBRADA, "Video se obrađuje"));
        obrada.submit(() -> {
            try {
                obradiIPosalji(videoId, folder, ulaz);
                jdbcTemplate.update("INSERT INTO video (url, lekcijaId) VALUES (?, ?)", videoId, lekcijaId);
                statusi.put(videoId, new Status(Stanje.GOTOVO, "Video je dodat"));
                System.out.println("[Video] Gotov " + videoId + " (lekcija " + lekcijaId + ")");
            } catch (Exception e) {
                e.printStackTrace();
                statusi.put(videoId, new Status(Stanje.GRESKA, "Obrada videa nije uspela: " + e.getMessage()));
            } finally {
                obrisiFolder(folder);
            }
        });
        return videoId;
    }

    public Status status(String videoId) {
        return statusi.getOrDefault(videoId, new Status(Stanje.GRESKA, "Nepoznat video"));
    }

    // Stari poziv (sinhrono): isto kao primiZaLekciju, ali bez upisa u bazu
    public String convertToHlsAndUpload(MultipartFile file) throws Exception {
        String videoId = UUID.randomUUID().toString();
        Path folder = Files.createTempDirectory("hls-" + videoId);
        try {
            Path ulaz = folder.resolve("ulaz");
            file.transferTo(ulaz);
            obradiIPosalji(videoId, folder, ulaz);
            return videoId;
        } finally {
            obrisiFolder(folder);
        }
    }

    private void obradiIPosalji(String videoId, Path folder, Path ulaz) throws Exception {
        Path hls = Files.createDirectory(folder.resolve("hls"));

        // H.264 do 1080p se samo prepakuje (brzo); 4K i HEVC sa telefona se pretvaraju u H.264 1080p
        // jer HEVC ne puštaju svi pregledači, a 4K je pretežak za gledanje preko interneta
        String[] video = sondaVidea(ulaz);
        boolean prepakuj = "h264".equals(video[0]) && parseVisina(video[1]) > 0 && parseVisina(video[1]) <= 1080;
        System.out.println("[Video] " + videoId + ": codec=" + video[0] + " visina=" + video[1] + (prepakuj ? " -> prepakivanje" : " -> konverzija u H.264 1080p"));

        List<String> komanda = new ArrayList<>(List.of(alat("ffmpeg"), "-y", "-i", ulaz.toString()));
        if (prepakuj) {
            komanda.addAll(List.of("-c:v", "copy"));
        } else {
            komanda.addAll(List.of("-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                    "-vf", "scale=-2:'min(1080,ih)'", "-pix_fmt", "yuv420p"));
        }
        komanda.addAll(List.of("-c:a", "aac", "-b:a", "128k",
                "-start_number", "0", "-hls_time", "10", "-hls_list_size", "0", "-f", "hls",
                hls.resolve("index.m3u8").toString()));

        Process process = new ProcessBuilder(komanda).redirectErrorStream(true).start();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // ffmpeg ispisuje napredak; u log ide samo ponešto da se ne zatrpa
                if (line.startsWith("frame=") && !line.contains("time=00:00:0")) continue;
                System.out.println(line);
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg konverzija nije uspela, exit code: " + exitCode);
        }

        // na Hetzner idu samo HLS delovi (ne i originalni snimak)
        String remoteFolder = "/videos/" + videoId;
        hetzner.createFolder(remoteFolder);
        List<Path> delovi;
        try (var lista = Files.list(hls)) {
            delovi = lista.toList();
        }
        ExecutorService slanje = Executors.newFixedThreadPool(6);
        List<String> greske = java.util.Collections.synchronizedList(new ArrayList<>());
        for (Path path : delovi) {
            slanje.submit(() -> {
                try {
                    hetzner.uploadEncryptedFile(remoteFolder, path.getFileName().toString(), Files.readAllBytes(path));
                } catch (Exception e) {
                    greske.add(path.getFileName() + ": " + e.getMessage());
                }
            });
        }
        slanje.shutdown();
        if (!slanje.awaitTermination(60, TimeUnit.MINUTES)) throw new RuntimeException("Slanje na Hetzner je predugo trajalo");
        if (!greske.isEmpty()) throw new RuntimeException("Neuspelo slanje " + greske.size() + " delova, npr. " + greske.get(0));
    }

    // [codec, visina] prvog video toka, npr. ["hevc", "2160"]; prazno ako ffprobe ne uspe
    private static String[] sondaVidea(Path ulaz) {
        try {
            Process p = new ProcessBuilder(alat("ffprobe"), "-v", "error", "-select_streams", "v:0",
                    "-show_entries", "stream=codec_name,height", "-of", "csv=p=0", ulaz.toString())
                    .redirectErrorStream(true).start();
            String izlaz = new String(p.getInputStream().readAllBytes()).trim();
            p.waitFor(60, TimeUnit.SECONDS);
            String[] delovi = izlaz.split("\\R")[0].split(",");
            return new String[] { delovi[0].trim(), delovi.length > 1 ? delovi[1].trim() : "" };
        } catch (Exception e) {
            return new String[] { "", "" };
        }
    }

    private static int parseVisina(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static void obrisiFolder(Path folder) {
        try {
            Files.walkFileTree(folder, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws java.io.IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, java.io.IOException exc) throws java.io.IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (Exception e) {
            System.err.println("Neuspešno brisanje temp foldera: " + folder);
        }
    }
}
