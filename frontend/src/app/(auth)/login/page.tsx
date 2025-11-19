"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/views/login";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await apiPost<{ username: string; password: string }, { access_token: string; username: string; role: string }>(
        "/login",
        { username, password },
        false,
      );
      // store token and user info
      localStorage.setItem("abs_token", res.access_token);
      localStorage.setItem("abs_user", JSON.stringify({ username: res.username, role: res.role }));
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      toast.error("Login failed: " + (msg || "unknown"));
    }
  };

  return <LoginPage onLogin={handleLogin} />;
}