"use client";

import React, { useEffect, useState } from "react";

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

interface ContentLockGuardProps {
  contentId: string;
  authToken: string;
  children: React.ReactNode;
}

export const ContentLockGuard: React.FC<ContentLockGuardProps> = ({
  contentId,
  authToken,
  children,
}) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    if (!contentId) return;

    const checkLock = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/mini-quizzes/content/${contentId}/check-lock`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const json = await res.json();

        if (json.sukses && json.data) {
          setIsLocked(json.data.isLocked);
          setReason(json.data.alasan || "Selesaikan materi sebelumnya untuk membuka materi ini.");
        }
      } catch (err) {
        console.error("Gagal memeriksa status kuncian materi:", err);
      } finally {
        setChecking(false);
      }
    };

    checkLock();
  }, [contentId, authToken]);

  if (checking) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
        Memeriksa akses materi...
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-slate-800 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h4 className="text-base font-bold text-white">Materi Ini Terkunci</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{reason}</p>
      </div>
    );
  }

  return <>{children}</>;
};