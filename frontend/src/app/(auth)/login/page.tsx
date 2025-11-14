"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/views/login";

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = (username: string, role: "admin" | "viewer") => {
    // simpan user ke localStorage (sama seperti di App.tsx)
    const user = { username, role };
    localStorage.setItem("abs_user", JSON.stringify(user));

    // setelah login, arahkan ke dashboard
    router.push("/dashboard");
  };

  return <LoginPage onLogin={handleLogin} />;
}