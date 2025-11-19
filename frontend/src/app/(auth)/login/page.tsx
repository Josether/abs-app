"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/views/login";
import { toast } from "sonner";

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = (username: string, role: string) => {
    // Just navigate to dashboard, LoginPage already handled authentication
    toast.success("Login successful");
    router.push("/dashboard");
  };

  return <LoginPage onLogin={handleLogin} />;
}