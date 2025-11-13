import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ success: false });

  await db.notification.updateMany({
    where: { user_id: userId },
    data: { read: true },
  });

  return Response.json({ success: true });
}
