"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { getCookie } from "@/lib/cookieHelper";
import { Loader2 } from "lucide-react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, logout, isInitialized } = useAuthStore();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = getCookie("auth-token");
      const savedUserStr = getCookie("user-data");

      if (savedToken && savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          // Only verify if we have a token but state hasn't caught up or to ensure validity
          if (!token || !user) {
            setAuth(savedUser, savedToken);
          }
          
          // Optional: Verify with backend
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
          const resp = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (!resp.ok) {
            throw new Error("Session expired");
          }
        } catch (err) {
          console.error("Auth verification failed:", err);
          logout();
        }
      } else if (!savedToken && token) {
        // State exists but cookie is gone (user cleared cookies)
        logout();
      }
      setVerifying(false);
    };

    if (isInitialized) {
      verifySession();
    }
  }, [isInitialized, setAuth, logout, token, user]);

  if (!isInitialized || verifying) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#070612] z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Initializing Sahayak...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
