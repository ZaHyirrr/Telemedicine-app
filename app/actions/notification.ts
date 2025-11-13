"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function createNotification({
  userId,
  title,
  message,
  url = null,
}: {
  userId: string;
  title: string;
  message: string;
  url?: string | null;
}) {
  try {
    const created = await db.notification.create({
      data: { user_id: userId, title, message, url },
    });

    return { success: true, data: created };
  } catch (err) {
    console.error("Notification create error", err);
    return { success: false };
  }
}

export async function markRead(id: number) {
  try {
    await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllRead() {
  const { userId } = await auth();
  if (!userId) return;

  await db.notification.updateMany({
    where: { user_id: userId },
    data: { read: true },
  });

  return { success: true };
}
