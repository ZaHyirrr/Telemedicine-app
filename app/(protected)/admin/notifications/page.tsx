import React from "react";

export default async function AdminNotificationsPage() {
  const res = await fetch("/api/admin/notifications", { cache: "no-store" });
  const data = await res.json();
  const notes = data.notifications || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Notifications (Admin)</h1>

      {notes.length === 0 && <p className="text-gray-500">No notifications.</p>}

      <div className="space-y-3">
        {notes.map((n: any) => (
          <div key={n.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <p><span className="font-semibold">Title:</span> {n.title}</p>
            <p><span className="font-semibold">Message:</span> {n.message}</p>
            {n.url && <p><a className="text-sm text-blue-600" href={n.url}>Open</a></p>}
            <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
