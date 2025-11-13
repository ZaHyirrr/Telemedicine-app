// app/notifications/page.tsx
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import Link from "next/link";

export default async function NotificationsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="p-6 text-center text-gray-500">
        You must be logged in to view notifications.
      </div>
    );
  }

  const notifications = await db.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Notifications</h1>

        {/* Server action: gọi auth() bên trong để an toàn về userId */}
        <form action={async function markAll() {
          "use server";
          const { userId: uid } = await auth();
          if (!uid) return;

          await db.notification.updateMany({
            where: { user_id: uid },
            data: { read: true },
          });
        }}>
          <button
            type="submit"
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md"
          >
            Mark all as read
          </button>
        </form>
      </div>

      {notifications.length === 0 && (
        <p className="text-gray-500">No notifications yet.</p>
      )}

      <div className="space-y-3">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.url || "#"}
            className={`block p-4 rounded-md border ${
              n.read ? "bg-gray-50" : "bg-blue-50"
            }`}
          >
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm text-gray-600">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
