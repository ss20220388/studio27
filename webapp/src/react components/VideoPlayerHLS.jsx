import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import useZastitaSnimanja from "./useZastitaSnimanja";

const VideoPlayerHLS = ({ videoId, fileName = "index.m3u8", accessToken, API_URL }) => {
  const videoRef = useRef();
  const reachedCheckpoints = useRef(new Set());
  const [userId, setUserId] = useState(null);
  const { razlog, poruka, otkljucaj } = useZastitaSnimanja(videoRef);

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
    <div className="relative w-full h-full" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        controls={!razlog}
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => razlog && videoRef.current.pause()}
        className={`w-full h-full object-contain bg-black ${razlog ? "invisible" : ""}`}
      />
      {razlog && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
          <p className="text-sm text-neutral-200">{poruka}</p>
          {razlog !== "devtools" && (
            <button
              type="button"
              onClick={otkljucaj}
              className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Nastavi gledanje
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayerHLS;