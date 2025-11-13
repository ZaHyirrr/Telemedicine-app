"use client";

import { useSearchParams } from "next/navigation";

export default function VideoClient() {
  const params = useSearchParams();
  const url = params.get("url");

  if (!url) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-xl">
        ❌ No video room URL provided.
      </div>
    );
  }

  return (
    <iframe
      src={url}
      allow="camera; microphone; fullscreen; display-capture"
      className="w-full h-screen"
      style={{ border: "0" }}
    />
  );
}
