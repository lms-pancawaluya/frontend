"use client";

import React, { useEffect, useState } from "react";
import { LockStatusResponse } from "@/types/miniQuiz";

interface ContentLockGuardProps {
  contentId: string;
  authToken: string;
  children: React.ReactNode;
}

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

export const ContentLockGuard: React.FC<ContentLockGuardProps> = ({
  contentId,
  authToken,
  children,
}) => {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const checkLock = async () => {
      // Fallback jika token kosong agar UI tidak hang
      if (!authToken) {
        console.warn("Token belum tersedia di LocalStorage.");
        setIsLocked(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/mini-quizzes/check-lock/${contentId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json: LockStatusResponse = await res.json();
        
        if (json.sukses) {
          setIsLocked(json.data.isLocked);
          setReason(json.data.alasan);
        } else {
          setIsLocked(false);
        }
      } catch (err) {
        console.error("Gagal mengecek penguncian materi:", err);
        setIsLocked(false); // Buka akses jika API error/unreachable
      }
    };

    if (contentId) {
      checkLock();
    }
  }, [contentId, authToken]);

  if (isLocked === null) {
    return <div className="p-12 text-center text-slate-500 text-sm">Mengecek akses materi...</div>;
  }

  if (isLocked) {
    return (
      <div className="p-8 max-w-md mx-auto my-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
        <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 002-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800">Materi Terkunci</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {reason || "Selesaikan mini quiz pada materi sebelumnya untuk mengakses materi ini."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};