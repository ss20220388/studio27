import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const VideoPlayerHLS = ({ videoId, fileName = "index.m3u8", accessToken, API_URL }) => {
  const videoRef = useRef();
  const reachedCheckpoints = useRef(new Set());
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include"
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUserId(userData.userId);
        } else {
          console.error("Greška pri dohvatanju auth/me", userRes.status);
        }
      } catch (error) {
        console.error("Mrežna greška pri auth/me:", error);
      }
    }

    if (accessToken) {
      fetchUser();
    }
  }, [accessToken, API_URL]);

  useEffect(() => {
    reachedCheckpoints.current.clear();
  }, [videoId]);

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

  async function saveProgressToServer(procenat, vremeGledanja) {
    if (!userId) {
      console.warn("Korisnik još nije učitan, preskačem slanje napretka.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/odgledao/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          studentId: userId,
          videoId: videoId,
          procenat: procenat,
          vremeGledanja: vremeGledanja, 
        }),
      });

      if (!response.ok) {
        console.error("Greška pri snimanju napretka", response.status);
      } else {
        console.log(`Uspešno zabeležen napredak: ${procenat}%`);
      }
    } catch (error) {
      console.error("Mrežna greška pri snimanju napretka:", error);
    }
  }

  function handleTimeUpdate() {
    if (!videoRef.current || !videoRef.current.duration) return;

    const { currentTime, duration } = videoRef.current;
    const percent = (currentTime / duration) * 100;
    
    const checkpoints = [10, 20, 30,40,50,60,70,80,90,95];

    checkpoints.forEach((checkpoint) => {
      if (percent >= checkpoint && !reachedCheckpoints.current.has(checkpoint)) {
        reachedCheckpoints.current.add(checkpoint);
        saveProgressToServer(checkpoint, currentTime);
      }
    });
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      onTimeUpdate={handleTimeUpdate}
      className="w-full h-full object-contain bg-black"
    />
  );
};

export default VideoPlayerHLS;