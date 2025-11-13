import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ notifications: [], unread: 0 });

  const notifications = await db.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  const unread = await db.notification.count({
    where: { user_id: userId, read: false },
  });

  return Response.json({ notifications, unread });
}
