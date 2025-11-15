"use server";

import db from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";

// IMPORT ĐÚNG — NHỚ SỬA LẠI ĐƯỜNG DẪN NÀY
import {
  reviewSchema,
  ReviewFormValues,
} from "@/app/lib/validations/review";

export async function deleteDataById(
  id: string,
  deleteType: "doctor" | "staff" | "patient" | "payment" | "bill" | "medical"
) {
  try {
    // 1. Logic xóa Clerk User (giữ nguyên)
    if (
      deleteType === "doctor" ||
      deleteType === "staff" ||
      deleteType === "patient"
    ) {
      await fetch(`https://api.clerk.dev/v1/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });
    }

    // 2. Logic xóa bản ghi Database (đã sửa)
    if (deleteType === "doctor") {
      await db.doctor.delete({ where: { id } });
      return { success: true, message: "Doctor deleted", status: 200 };
    }

    if (deleteType === "staff") {
      await db.staff.delete({ where: { id } });
      return { success: true, message: "Staff deleted", status: 200 };
    }

    if (deleteType === "patient") {
      await db.patient.delete({ where: { id } });
      return { success: true, message: "Patient deleted", status: 200 };
    }

    // <-- ĐÃ TÁCH VÀ SỬA LOGIC DƯỚI ĐÂY -->
    
    // Xóa Hóa đơn Gốc (Payment)
    if (deleteType === "payment") {
      // id là số nên cần Number(id)
      await db.payment.delete({ where: { id: Number(id) } });
      return { success: true, message: "Payment (Invoice) deleted", status: 200 };
    }
    
    // Xóa mục Hóa đơn Chi tiết (Bill Item/PatientBills)
    if (deleteType === "bill") {
      // id là số nên cần Number(id). Sử dụng model PatientBills
      await db.patientBills.delete({ where: { id: Number(id) } });
      return { success: true, message: "Bill item deleted", status: 200 };
    }
    // <-- KẾT THÚC LOGIC ĐÃ SỬA -->


    if (deleteType === "medical") {
      await db.medicalRecords.delete({ where: { id: Number(id) } });
      return { success: true, message: "Medical record deleted", status: 200 };
    }

    return {
      success: false,
      message: "Unknown delete type",
      status: 400,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      // Cập nhật thông báo để phản ánh lỗi server
      message: "Internal Server Error or failed to delete record.", 
      status: 500,
    };
  }
}

export async function createReview(values: ReviewFormValues) {
  try {
    const validated = reviewSchema.parse(values);

    await db.rating.create({
      data: {
        patient_id: validated.patient_id,
        doctor_id: validated.doctor_id,
        rating: validated.rating,
        comment: validated.comment,
      },
    });

    return {
      success: true,
      message: "Review created successfully",
      status: 200,
    };
  } catch (error) {
    console.log("CREATE REVIEW ERROR:", error);

    return {
      success: false,
      message: "Internal Server Error",
      status: 500,
    };
  }
}
