"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createReview(data: any) {
  try {
    const { patient_id, doctor_id, rating, comment } = data;

    if (!patient_id || !doctor_id || !rating) {
      return { success: false, message: "Missing required fields" };
    }

    await db.rating.create({
      data: {
        patient_id,
        doctor_id: doctor_id, // ✔ staff_id trong Prisma chính là doctor_id
        rating,
        comment,
      },
    });

    revalidatePath("/record/appointments");
    return { success: true, message: "Review added successfully" };
  } catch (error) {
    console.error("REVIEW ERROR:", error);
    return { success: false, message: "Internal Server Error" };
  }
}
