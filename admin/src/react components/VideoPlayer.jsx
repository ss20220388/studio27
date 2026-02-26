import { useEffect, useState, useRef } from "react";

export default function VideoPlayer({ videoPath, accessToken }) {
  const videoRef = useRef(null);
  const [videoToken, setVideoToken] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const intervalRef = useRef(null);

  // fetch novi video token
  const fetchVideoToken = async () => {
    if (!accessToken || !videoPath) return;
    try {
      console.log("Fetching video token for path:", videoPath);
      const res = await fetch(
        `/api/video/generate-video-token?videoPath=${encodeURIComponent(videoPath)}`,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch video token");

      const data = await res.json();
      console.log("Video token data:", data);

      setVideoToken(data.videoToken);

      const currentTime = videoRef.current?.currentTime || 0;

      const newUrl = `/api/video/stream-protected?remoteFilePath=${encodeURIComponent(
        videoPath
      )}&videoToken=${data.videoToken}`;
      setVideoUrl(newUrl);

      // Update video src i nastavi playback
      if (videoRef.current) {
        videoRef.current.src = newUrl;
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {
          // ignoriši grešku ako video nije ready
        });
      }
    } catch (err) {
      console.error("Error fetching video token:", err);
    }
  };

  useEffect(() => {
    if (!accessToken || !videoPath) return;

    
    fetchVideoToken();
    intervalRef.current = setInterval(fetchVideoToken, 1* 60 * 1000);

    return () => clearInterval(intervalRef.current);
  }, [videoPath, accessToken]);

  // show loader dok token nije spreman
  if (!videoUrl) return <p>Loading video...</p>

  return (
    <video
      ref={videoRef}
      controls
      download={false}
      width="720"
      src={videoUrl}
      
    />
  );
}