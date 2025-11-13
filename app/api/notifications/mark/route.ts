import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { id } = await req.json();
  const { userId } = await auth();

  if (!userId) return Response.json({ success: false });

  await db.notification.updateMany({
    where: { id, user_id: userId },
    data: { read: true },
  });

  return Response.json({ success: true });
}
