"use client";

import { Suspense } from "react";
import VideoClient from "./video-client";

export const dynamic = "force-dynamic"; 
// ⬆ BẮT BUỘC — Ngăn Next.js prerender trang này

export default function VideoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading video…</div>}>
      <VideoClient />
    </Suspense>
  );
}
