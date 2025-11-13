"use client";

import { Button } from "./ui/button";

export function Topbar({
  username,
  role,
  onLogout,
}: {
  username: string;
  role: "admin" | "viewer";
  onLogout: () => void;
}) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="font-semibold text-sm text-gray-700">
        Automated Backup System
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">
          {username} ({role})
        </span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
