import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayerHLS = ({ videoId, fileName = "index.m3u8", accessToken }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (!videoRef.current) return;

    const src = `/api/hls/${videoId}/${fileName}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr, url) {
          // Prosleđuje header za svaki zahtev (.m3u8 i .ts)
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          // Ako koristiš cookies/credentials:
          // xhr.withCredentials = true;
        },
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play();
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = src;
      videoRef.current.addEventListener("loadedmetadata", () => {
        videoRef.current.play();
      });
    }
  }, [videoId, fileName, accessToken]);

  return <video ref={videoRef} controls style={{ width: "100%" }} />;
};

export default VideoPlayerHLS;