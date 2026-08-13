"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayerWithQuiz } from "@/app/components/mini-quiz/VideoPlayerWithQuiz";
import { ContentLockGuard } from "@/app/components/mini-quiz/ContentLockGuard";

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

export default function PembelajaranPage() {
  const params = useParams();
  const contentId = params?.contentId as string;

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [authToken] = useState<string>(() => {
    return (
      localStorage.getItem("token") || localStorage.getItem("authToken") || ""
    );
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!contentId) return;
    const token = authToken;

    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/contents/${contentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();

        if (json.sukses && json.data) {
          // Menggunakan field 'konten' dari response backend
          setVideoUrl(json.data.konten || "");
        }
      } catch (err) {
        console.error("Gagal mengambil materi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentId, authToken]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Memuat materi pembelajaran...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Materi Pembelajaran</h1>

      <ContentLockGuard contentId={contentId} authToken={authToken}>
        <VideoPlayerWithQuiz
          videoUrl={videoUrl || "https://youtu.be/C0PQt4rh_io"}
          contentId={contentId}
          authToken={authToken}
        />
      </ContentLockGuard>
    </div>
  );
}