"use server";

import db from "@/lib/db";
import { AppointmentSchema } from "@/lib/schema";
import { AppointmentStatus } from "@prisma/client";
import { VitalSignsSchema } from "@/lib/schema";
import { createNotification } from "@/app/actions/notification";

/**
 * ✅ CREATE NEW APPOINTMENT (SAFE)
 */
export async function createNewAppointment(data: any) {
  try {
    console.log("📥 Incoming booking data:", data);

    // ✅ Validate
    const validated = AppointmentSchema.safeParse(data);

    if (!validated.success) {
      console.log("❌ Validation failed:", validated.error);
      return { success: false, msg: "Invalid data" };
    }

    const v = validated.data;

    // ✅ Prepare proper date format
    const appointmentDate = new Date(v.appointment_date);
    if (isNaN(appointmentDate.getTime())) {
      return { success: false, msg: "Invalid appointment date format" };
    }

    /* ==============================================================
       ✅ 1. CHECK PATIENT DOUBLE BOOKING (same day + same time)
    ============================================================== */
    const patientConflict = await db.appointment.findFirst({
      where: {
        patient_id: data.patient_id,
        appointment_date: appointmentDate,
        time: v.time,
        status: { in: ["SCHEDULED", "PENDING", "COMPLETED"] },
      },
    });

    if (patientConflict) {
      return {
        success: false,
        msg: "❌ You already booked an appointment at this time.",
      };
    }

    /* ==============================================================
       ✅ 2. CHECK DOCTOR DOUBLE BOOKING (same day + same time)
    ============================================================== */
    const doctorConflict = await db.appointment.findFirst({
      where: {
        doctor_id: v.doctor_id,
        appointment_date: appointmentDate,
        time: v.time,
        status: { in: ["SCHEDULED", "PENDING", "COMPLETED"] },
      },
    });

    if (doctorConflict) {
      return {
        success: false,
        msg: "❌ This doctor is not available at the selected time.",
      };
    }

    /* ==============================================================
       ✅ 3. CREATE APPOINTMENT (SAFE)
    ============================================================== */
    const created = await db.appointment.create({
      data: {
        patient_id: data.patient_id,
        doctor_id: v.doctor_id,
        time: v.time,
        type: v.type,
        appointment_date: appointmentDate,
        note: v.note,
      },
    });

    try {
      await createNotification({
        userId: v.doctor_id, // Clerk doctorId
        title: "Yêu cầu lịch hẹn mới",
        message: `Bạn có lịch hẹn từ bệnh nhân vào lúc ${v.time} - ${appointmentDate.toLocaleDateString()}`,
        url: `/doctor/appointments/${created.id}`,
      });
    } catch (err) {
      console.error("❌ Failed to send notification to doctor:", err);
    }

    return {
      success: true,
      message: "✅ Appointment booked successfully",
    };
  } catch (error: any) {
    console.error("❌ CREATE APPOINTMENT ERROR:", error);
    return { success: false, msg: error?.message || "Internal Server Error" };
  }
}
export async function appointmentAction(
  id: string | number,
  status: AppointmentStatus,
  reason: string
) {
  try {
    console.log("📌 Update appointment:", id, status, reason);

    const updateData: any = { status, reason };

    // 📌 Lấy appointment để biết patient_id & doctor_id
    const appt = await db.appointment.findUnique({
      where: { id: Number(id) },
      include: { doctor: true, patient: true },
    });

    if (!appt) {
      return { success: false, msg: "Appointment not found" };
    }

    /* ==============================================================
       🔔 CASE 1 — SCHEDULED → Gửi video link + notify Patient
    ============================================================== */
    if (status === "SCHEDULED") {
      const { generateVideoRoom } = await import("@/utils/video");
      updateData.video_link = await generateVideoRoom(Number(id));

      console.log("✅ Video link created:", updateData.video_link);

      // 🔔 Notify patient
      await createNotification({
        userId: appt.patient_id,
        title: "Lịch hẹn đã được xác nhận",
        message: `Bác sĩ ${appt.doctor.name} đã xác nhận lịch hẹn.`,
        url: `/patient/appointments/${appt.id}`,
      });

      // 🔔 Notify có video link
      await createNotification({
        userId: appt.patient_id,
        title: "Cuộc gọi video đã sẵn sàng",
        message: "Bấm để vào phòng khám trực tuyến.",
        url: updateData.video_link,
      });
    }

    /* ==============================================================
       🔔 CASE 2 — CANCELLED → Notify Patient
    ============================================================== */
    if (status === "CANCELLED") {
      await createNotification({
        userId: appt.patient_id,
        title: "Lịch hẹn bị huỷ",
        message: `Bác sĩ đã huỷ lịch hẹn của bạn. ${reason ? "Lý do: " + reason : ""}`,
        url: `/patient/appointments/${appt.id}`,
      });
    }

    // 🎯 UPDATE APPOINTMENT
    await db.appointment.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return {
      success: true,
      msg: `Appointment ${status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.error("❌ APPOINTMENT ACTION ERROR:", error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function addVitalSigns(
  data: any,
  appointmentId: string,
  doctorId: string
) {
  try {
    console.log("📥 Adding vital signs:", data);

    const validatedData = VitalSignsSchema.parse(data);
    let medicalRecord = null;

    if (!validatedData.medical_id) {
      medicalRecord = await db.medicalRecords.create({
        data: {
          patient_id: validatedData.patient_id,
          appointment_id: Number(appointmentId),
          doctor_id: doctorId,
        },
      });
    }

    const med_id = validatedData.medical_id || medicalRecord?.id;

    await db.vitalSigns.create({
      data: {
        ...validatedData,
        medical_id: Number(med_id),
      },
    });

    return {
      success: true,
      msg: "Vital signs added successfully",
    };
  } catch (error) {
    console.error("❌ ADD VITAL SIGNS ERROR:", error);
    return { success: false, msg: "Internal Server Error" };
  }
}


