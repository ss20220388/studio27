package com.server.studio27.models;

import java.io.InputStream;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.Session;

public class SftpStream {
    public final InputStream inputStream;
    public final Session session;
    public final ChannelSftp channel;
    public SftpStream(InputStream is, Session s, ChannelSftp c) {
        this.inputStream = is; this.session = s; this.channel = c;
    }
}
