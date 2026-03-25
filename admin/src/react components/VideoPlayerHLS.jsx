import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayerHLS = ({ videoId, fileName = "index.m3u8", accessToken ,API_URL}) => {
  const videoRef = useRef();

  useEffect(() => {
    if (!videoRef.current) return;

    const src = `${API_URL}/api/hls/${videoId}/${fileName}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr, url) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
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
  }, [videoId, fileName, accessToken, API_URL]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className="w-full h-full object-contain bg-black"
    />
  );
};

export default VideoPlayerHLS;