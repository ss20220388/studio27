import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayerHLS = ({ videoId, fileName = "index.m3u8", accessToken ,API_URL}) => {
  const videoRef = useRef();

  const resolveSource = (value) => {
    if (!value) return "";

    const trimmedValue = String(value).trim();
    if (!trimmedValue) return "";

    if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith("/")) {
      if (trimmedValue.includes("/api/hls/") || trimmedValue.includes("/hls/")) {
        if (trimmedValue.endsWith(".m3u8")) {
          return trimmedValue;
        }

        const apiMatch = trimmedValue.match(/\/api\/hls\/([^/?#]+)/i);
        if (apiMatch && apiMatch[1]) {
          return `${API_URL}/api/hls/${apiMatch[1]}/${fileName}`;
        }

        const hlsMatch = trimmedValue.match(/\/hls\/([^/?#]+)/i);
        if (hlsMatch && hlsMatch[1]) {
          return `${API_URL}/api/hls/${hlsMatch[1]}/${fileName}`;
        }
      }

      return trimmedValue;
    }

    return `${API_URL}/api/hls/${trimmedValue}/${fileName}`;
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const src = resolveSource(videoId);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr, url) {
          if (accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          }
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