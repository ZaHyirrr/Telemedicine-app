"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  url?: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    setNotifications(data.notifications);
    setUnread(data.unread);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  async function openNotification(n: Notification) {
    await fetch("/api/notifications/mark", {
      method: "POST",
      body: JSON.stringify({ id: n.id }),
    });

    setOpen(false);
    load();

    if (n.url) window.location.href = n.url;
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-md rounded-md p-2 z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="text-gray-400 text-center py-4">No notifications</p>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => openNotification(n)}
              className={`p-3 border rounded-md cursor-pointer mb-1 ${
                n.read ? "bg-gray-50" : "bg-blue-50"
              }`}
            >
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
