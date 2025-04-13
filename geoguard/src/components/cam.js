import React, { useEffect, useRef, useState } from "react";

function Cam() {
  const [loaded, setLoaded] = useState(false);
  
  const [summary, setSummary] = useState(""); // new state for summary
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoaded(true);
      } catch (err) {
        console.warn("Back camera not available, falling back to front camera:", err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
          setLoaded(true);
        } catch (fallbackErr) {
          console.error("Failed to access any camera:", fallbackErr);
          setLoaded(true);
        }
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSendFrame();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const captureAndSendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("https://bitcamp2025-slpu.onrender.com/detect-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();
      
      setSummary(data.summary || ""); // set Gemini response if exists
    } catch (error) {
      console.error("Text detection failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!loaded && <p>Loading camera...</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-xl shadow-lg"
        width="640"
        height="480"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="mt-4 w-full max-w-lg bg-gray-50 p-6 rounded-lg shadow-lg">
        {summary && (
          <div className="mt-4 bg-blue-100 p-4 rounded-md border border-blue-200 shadow-sm">
            <h3 className="font-semibold text-lg text-blue-900"> Summary</h3>
            <p className="text-sm text-gray-800">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cam;
