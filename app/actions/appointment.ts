"use server";

import db from "@/lib/db";
import { AppointmentSchema } from "@/lib/schema";
import { AppointmentStatus } from "@prisma/client";
import { VitalSignsSchema } from "@/lib/schema";


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

    console.log("📅 Date:", appointmentDate);
    console.log("⏰ Time:", v.time);
    console.log("🧑‍⚕️ Doctor:", v.doctor_id);
    console.log("🧍 Patient:", data.patient_id);

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
      console.log("❌ Patient conflict:", patientConflict);
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
      console.log("❌ Doctor conflict:", doctorConflict);
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

    console.log("✅ Appointment created:", created);

    return {
      success: true,
      message: "✅ Appointment booked successfully",
    };
  } catch (error: any) {
    console.error("❌ CREATE APPOINTMENT ERROR:", error);
    return {
      success: false,
      msg: error?.message || "Internal Server Error",
    };
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

    // ✅ Tự động tạo video call link khi appointment được APPROVE
    if (status === "SCHEDULED") {
      const { generateVideoRoom } = await import("@/utils/video");
      updateData.video_link = await generateVideoRoom(Number(id));

      console.log("✅ Video link created:", updateData.video_link);
    }

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


