package com.server.studio27.services; // Podesi paket u skladu sa tvojom strukturom projekta

import java.io.InputStream;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpATTRS;

// Helper klasa za pakovanje stream-a i SFTP resursa radi zatvaranja
public class SftpDownloadStream implements AutoCloseable {
    private final InputStream inputStream;
    private final SftpATTRS attrs;
    private final Session session;
    private final ChannelSftp sftp;

    public SftpDownloadStream(InputStream inputStream, SftpATTRS attrs, Session session, ChannelSftp sftp) {
        this.inputStream = inputStream;
        this.attrs = attrs;
        this.session = session;
        this.sftp = sftp;
    }

    public InputStream getInputStream() { 
        return inputStream; 
    }
    
    public long getFileSize() { 
        return attrs.getSize(); 
    }

    @Override
    public void close() {
        if (inputStream != null) {
            try { 
                inputStream.close(); 
            } catch (Exception ignored) {}
        }
        if (sftp != null && sftp.isConnected()) {
            sftp.disconnect();
        }
        if (session != null && session.isConnected()) {
            session.disconnect();
        }
    }
}