package com.server.studio27.controllers;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
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

    /* ========================= */
    /*  PRIVATE SESSION FACTORY  */
    /* ========================= */

    private Session createSession() throws JSchException {
        JSch jsch = new JSch();
        Session session = jsch.getSession(user, host, port);
        session.setPassword(password);

        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);

        session.connect(15000); // 15s timeout
        return session;
    }

    /* ========================= */
    /*  BASIC OPERATIONS         */
    /* ========================= */

    public String createFolder(String path) {
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            try {
                sftp.mkdir(path);
            } catch (SftpException ignored) {
                // Folder možda već postoji
            }

            return "Folder ready";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    public String addFiletoFolder(String remoteFolderPath, MultipartFile file) {
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            String fullPath = remoteFolderPath + "/" + file.getOriginalFilename();
            sftp.put(file.getInputStream(), fullPath);

            return "File uploaded";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error uploading: " + e.getMessage();
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    public List<String> listFilesInFolder(String remoteFolderPath) {
        List<String> fileNames = new ArrayList<>();
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            Vector<ChannelSftp.LsEntry> files = sftp.ls(remoteFolderPath);
            for (ChannelSftp.LsEntry entry : files) {
                fileNames.add(entry.getFilename());
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }

        return fileNames;
    }

    public byte[] downloadFile(String remoteFilePath) {
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            sftp.get(remoteFilePath, baos);

            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    public String deleteFile(String remoteFilePath) {
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            sftp.rm(remoteFilePath);
            return "Deleted";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error deleting: " + e.getMessage();
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    /* ========================= */
    /*  STREAMING METHODS        */
    /* ========================= */

    public long getFileSize(String remoteFilePath) throws Exception {
        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            return sftp.stat(remoteFilePath).getSize();

        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    public SftpStream getVideoStream(String remotePath, long start) throws Exception {

        Session session = createSession();
        ChannelSftp channel = (ChannelSftp) session.openChannel("sftp");
        channel.connect();

        InputStream is = channel.get(remotePath, null, start);

        return new SftpStream(is, session, channel);
    }

    public String uploadEncryptedFile(String remoteFolderPath, String filename, byte[] encryptedData) {

        Session session = null;
        ChannelSftp sftp = null;

        try {
            session = createSession();
            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect();

            try {
                sftp.mkdir(remoteFolderPath);
            } catch (Exception ignored) {}

            String fullPath = remoteFolderPath + "/" + filename;
            sftp.put(new ByteArrayInputStream(encryptedData), fullPath);

            return "Success: " + fullPath;

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }
}