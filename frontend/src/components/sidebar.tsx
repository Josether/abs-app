"use client";

import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "devices", label: "Devices" },
  { id: "schedules", label: "Schedules" },
  { id: "jobs", label: "Jobs" },
  { id: "backups", label: "Backups" },
  { id: "audit-logs", label: "Audit Logs" },
  { id: "users", label: "Users" },
];

export function Sidebar({
  currentPage,
  onNavigate,
  userRole,
}: {
  currentPage: string;
  onNavigate: (id: string) => void;
  userRole: "admin" | "viewer";
}) {
  return (
    <aside className="w-60 bg-slate-950 text-slate-50 flex flex-col">
      <div className="px-4 py-4 font-semibold border-b border-slate-800">
        ABS Web App
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          if (item.id === "users" && userRole !== "admin") return null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-800",
                currentPage === item.id && "bg-slate-800",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
