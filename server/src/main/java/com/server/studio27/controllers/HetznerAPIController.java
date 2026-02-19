package com.server.studio27.controllers;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Vector;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.server.studio27.models.SftpStream;

@Component
public class HetznerAPIController {

    @Value("${hetzner.api.token}")
    private String apiToken;

    @Value("${hetzner.host}")
    private String host;
    @Value("${hetzner.username}")
    private String user;
    @Value("${hetzner.password}")
    private String password;
    @Value("${hetzner.sftp.port}")
    private int port;
    private static final String BASE_URL = "https://api.hetzner.com/v1";
    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFile(MultipartFile file) {

        return file != null ? file.getOriginalFilename() : null;
    }

    public String getStorageBoxes(String name, String labelSelector, String sort, Integer page, Integer perPage) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(BASE_URL + "/storage_boxes");

        if (name != null && !name.isEmpty()) {
            builder.queryParam("name", name);
        }
        if (labelSelector != null && !labelSelector.isEmpty()) {
            builder.queryParam("label_selector", labelSelector);
        }
        if (sort != null && !sort.isEmpty()) {
            builder.queryParam("sort", sort);
        }
        if (page != null) {
            builder.queryParam("page", page);
        }
        if (perPage != null) {
            builder.queryParam("per_page", perPage);
        }

        String url = builder.toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);
            return response.getBody();
        } catch (Exception e) {
            e.printStackTrace();
            return String.format("{\"error\": \"%s\"}", e.getMessage());
        }
    }

    public String getStorageBoxFolders(Long storageBoxId) {

        String url = String.format("%s/storage_boxes/%d/folders", BASE_URL, storageBoxId);
        System.out.println("🗂️ Listing folders URL: " + url);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);
            System.out.println("✅ Response status: " + response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            return String.format("{\"error\": \"%s\", \"url\": \"%s\"}", e.getMessage(), url);
        }
    }

    public String createFolder(String path) {
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            sftp.mkdir(path);

            sftp.exit();
            session.disconnect();
            return "Folder created successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error creating folder: " + e.getMessage();
        }
    }

    public String addFiletoFolder(String remoteFolderPath, MultipartFile file) {
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            sftp.put(file.getInputStream(), remoteFolderPath + "/" + file.getOriginalFilename());

            sftp.exit();
            session.disconnect();
            return "File uploaded successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error uploading file: " + e.getMessage();
        }
    }

    public List<String> listFilesInFolder(String remoteFolderPath) {
        List<String> fileNames = new ArrayList<>();
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            Vector<ChannelSftp.LsEntry> files = sftp.ls(remoteFolderPath);
            for (ChannelSftp.LsEntry entry : files) {
                fileNames.add(entry.getFilename());
            }

            sftp.exit();
            session.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return fileNames;

    }

    public byte[] downloadFile(String remoteFilePath) {
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            sftp.get(remoteFilePath, baos);

            byte[] fileData = baos.toByteArray();

            sftp.exit();
            session.disconnect();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    remoteFilePath.substring(remoteFilePath.lastIndexOf("/") + 1));
            return fileData;
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    public String deleteFile(String remoteFilePath) {
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            sftp.rm(remoteFilePath);

            sftp.exit();
            session.disconnect();
            return "File deleted successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error deleting file: " + e.getMessage();
        }
    }

    public SftpStream getVideoStream(String remotePath, long start) throws Exception {
        JSch jsch = new JSch();
        Session session = jsch.getSession(user, host, port);
        session.setPassword(password);
        session.setConfig("StrictHostKeyChecking", "no");
        session.connect();

        ChannelSftp channel = (ChannelSftp) session.openChannel("sftp");
        channel.connect();

        InputStream is = channel.get(remotePath, null, start);
        return new SftpStream(is, session, channel);
    }

    public long getFileSize(String remoteFilePath) {
        JSch jsch = new JSch();
        try {
            Session session = jsch.getSession(user, host, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            ChannelSftp sftp = (ChannelSftp) channel;

            long fileSize = sftp.stat(remoteFilePath).getSize();

            sftp.exit();
            session.disconnect();

            return fileSize;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

}