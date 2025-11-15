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
    const actorId = data.actorId; // ⬅ FIXED
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
      const patientInfo = await db.patient.findUnique({
        where: { id: data.patient_id },
      });
      await createNotification({
        userId: v.doctor_id, // Clerk doctorId
        title: "Yêu cầu lịch hẹn mới",
        message: `Bạn có lịch hẹn từ bệnh nhân ${patientInfo?.first_name} ${patientInfo?.last_name} vào lúc ${v.time} - ${appointmentDate.toLocaleDateString()}`,
        url: `/doctor/appointments/${created.id}`,
      });
    } catch (err) {
      console.error("❌ Failed to send notification to doctor:", err);
    }

    try {
      const patientInfo = await db.patient.findUnique({
        where: { id: data.patient_id },
      });
      const doctorInfo = await db.doctor.findUnique({
        where: { id: v.doctor_id },
      });
      await createNotification({
      userId: process.env.NEXT_PUBLIC_ADMIN_ID!, // admin nhận
      title: "Lịch hẹn mới",
      message: `Bệnh nhân ${patientInfo?.first_name} ${patientInfo?.last_name} đặt lịch với bác sĩ ${doctorInfo?.name} lúc ${v.time} - ${appointmentDate.toLocaleDateString()}`,
      url: `/admin/appointments/${created.id}`,
    });
    } catch (err) {
      console.error("❌ Failed to send notification to admin:", err);
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
    const appt = await db.appointment.findUnique({
      where: { id: Number(id) },
      include: { doctor: true, patient: true },
    });

    if (!appt) return { success: false, msg: "Appointment not found" };

    const updateData: any = { status, reason };

    const apptDate = new Date(appt.appointment_date);
    const dateStr = apptDate.toLocaleDateString();
    const timeStr = appt.time;

    /* ==============================================================
       🔔 CASE 1 — SCHEDULED (Doctor Approves Appointment)
    ============================================================== */
    if (status === "SCHEDULED") {
      const { generateVideoRoom } = await import("@/utils/video");
      updateData.video_link = await generateVideoRoom(Number(id));

      // Notify patient
      await createNotification({
        userId: appt.patient_id,
        title: `Lịch hẹn lúc ${timeStr} - ${dateStr} đã được xác nhận`,
        message: `Bác sĩ ${appt.doctor.name} đã xác nhận lịch hẹn.`,
        url: `/patient/appointments/${appt.id}`,
      });

      // Video call link
      await createNotification({
        userId: appt.patient_id,
        title: "Cuộc gọi video đã sẵn sàng",
        message: "Nhấn để tham gia phòng khám trực tuyến.",
        url: updateData.video_link,
      });

      try {
        await createNotification({
          userId: process.env.NEXT_PUBLIC_ADMIN_ID!,
          title: `Lịch hẹn lúc ${timeStr} - ${dateStr} đã được xác nhận`,
          message: `Bác sĩ ${appt.doctor.name} đã xác nhận lịch hẹn.`,
        });
      } catch (err) {
        console.error("❌ Failed to send notification to admin:", err);
      }
    }

    /* ==============================================================
       🔔 CASE 2 — CANCELLED
    ============================================================== */
    if (status === "CANCELLED") {
      // Notify patient
      await createNotification({
        userId: appt.patient_id,
        title: `Lịch hẹn lúc ${timeStr} - ${dateStr} đã bị bác sĩ hủy`,
        message: `${reason ? "Lý do: " + reason : ""}`,
        url: `/patient/appointments/${appt.id}`,
      });

      // Notify doctor
      await createNotification({
        userId: appt.doctor_id,
        title: `Lịch hẹn lúc ${timeStr} - ${dateStr} đã bị bệnh nhân hủy`,
        message: `Bệnh nhân ${appt.patient.first_name} ${appt.patient.last_name} đã hủy lịch hẹn. ${
          reason ? "Lý do: " + reason : ""
        }`,
        url: `/doctor/appointments/${appt.id}`,
      });

      try {
        await createNotification({
          userId: process.env.NEXT_PUBLIC_ADMIN_ID!,
          title: `Lịch hẹn lúc ${timeStr} - ${dateStr} bị huỷ`,
          message: `Lịch hẹn của bệnh nhân ${appt.patient.first_name} ${appt.patient.last_name} đã huỷ. ${
        reason ? "Lý do: " + reason : ""}`,
          url: `/admin/appointments/${appt.id}`,
        });
      } catch (err) {
        console.error("❌ Failed to send notification to admin:", err);
      }
    }

    // UPDATE DB
    await db.appointment.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return { success: true, msg: `Appointment ${status.toLowerCase()} successfully` };
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


