import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  // kiểm tra login (nếu muốn), nhưng ở admin panel bạn có layout protected rồi
  // trả về tất cả notifications gửi cho admin (id từ env)
  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID!;
  const notes = await db.notification.findMany({
    where: { user_id: adminId },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  return Response.json({ success: true, notifications: notes });
}
