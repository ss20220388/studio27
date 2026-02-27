package com.server.studio27.routes;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/hls")
public class HlsStreamController {

  @Value("${hetzner.host}")
    private String host;

    @Value("${hetzner.username}")
    private String user;

    @Value("${hetzner.password}")
    private String password;
   

    @GetMapping("/{videoId}/{fileName:.+}")
    public void streamFile(@PathVariable String videoId,
                           @PathVariable String fileName,
                           HttpServletResponse response) {

        String remotePath = "/videos/" + videoId + "/" + fileName;

        // Content-Type
        if (fileName.endsWith(".m3u8")) {
            response.setContentType("application/vnd.apple.mpegurl");
        } else if (fileName.endsWith(".ts")) {
            response.setContentType("video/MP2T");
        } else {
            response.setContentType("application/octet-stream");
        }

        Session session = null;
        ChannelSftp channel = null;

        try {
            JSch jsch = new JSch();
            session = jsch.getSession(user, host, 22);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect(10000); 

            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(10000);

            ServletOutputStream out = response.getOutputStream();
            channel.get(remotePath, out); 
            out.flush();

        } catch (JSchException | SftpException | java.io.IOException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        } finally {
            if (channel != null && channel.isConnected()) channel.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }
}