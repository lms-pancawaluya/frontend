"use client";

import React, { use } from "react";
import { VideoInteractiveQuiz } from "@/app/components/mini-quiz/VideoInteractiveQuiz";
import { ContentLockGuard } from "@/app/components/mini-quiz/ContentLockGuard";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default function PembelajaranDetailPage({ params }: PageProps) {
  const { contentId } = use(params);

  // Ambil token otentikasi (bisa disesuaikan dengan auth provider / cookies / localStorage proyek)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <ContentLockGuard contentId={contentId} authToken={token}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Materi Pembelajaran</h1>
          <p className="text-sm text-slate-500">
            Tonton video hingga selesai dan jawab mini quiz yang muncul di pertengahan video.
          </p>
        </div>

        <VideoInteractiveQuiz
          contentId={contentId}
          videoSrc="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          authToken={token}
          onQuizCompleted={() => {
            console.log("Quiz selesai dikerjakan.");
          }}
        />
      </ContentLockGuard>
    </div>
  );
}