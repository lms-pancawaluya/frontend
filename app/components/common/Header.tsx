"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/auth.service";

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  function checkLoginStatus() {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }

  checkLoginStatus();

  window.addEventListener("authChange", checkLoginStatus);

  return () => {
    window.removeEventListener("authChange", checkLoginStatus);
  };
}, []);

  function handleLogout() {
    logoutUser();
    setIsLoggedIn(false);
    router.push("/login");
  }

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">LMS Pancawaluya</h1>
        <nav>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-100 transition"
            >
              Logout
            </button>
          ) : (
            <span className="text-sm">Menu (sementara kosong dulu)</span>
          )}
        </nav>
      </div>
    </header>
  );
}