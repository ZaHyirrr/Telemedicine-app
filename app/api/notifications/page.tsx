import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function NotificationsPage() {
  const { userId } = await auth();
  const items = await db.notification.findMany({
    where: { user_id: userId! },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`p-4 border rounded-md ${n.read ? "bg-gray-50" : "bg-blue-50"}`}
          >
            <p className="font-semibold">{n.title}</p>
            <p>{n.message}</p>
            <p className="text-xs text-gray-400">
              {new Date(n.created_at).toLocaleString()}
            </p>
            {n.url && (
              <a href={n.url} className="text-blue-600 text-sm underline">
                Open
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
