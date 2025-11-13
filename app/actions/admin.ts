"use server";

import db from "@/lib/db";
import {
  DoctorSchema,
  ServicesSchema,
  StaffSchema,
  WorkingDaysSchema,
} from "@/lib/schema";
import { generateRandomColor } from "@/utils";
import { checkRole } from "@/utils/roles";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function createNewDoctor(data: any) {
  try {
    console.log("📥 RAW DATA:", JSON.stringify(data, null, 2));

    const values = DoctorSchema.safeParse(data);
    const workingDaysValues = WorkingDaysSchema.safeParse(data?.work_schedule);

    if (!values.success || !workingDaysValues.success) {
      console.error("❌ VALIDATION FAILED");
      return {
        success: false,
        errors: true,
        message: "Please provide all required info",
      };
    }

    const validatedValues = values.data;
    const workingDayData = workingDaysValues.data!;

    const nameParts = validatedValues.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const client = await clerkClient();

    // ✅ THÊM USERNAME - Tạo từ email
    const username = validatedValues.email.split("@")[0].toLowerCase();
    // Hoặc dùng name: const username = validatedValues.name.toLowerCase().replace(/\s+/g, "");

    const clerkPayload = {
      emailAddress: [validatedValues.email.toLowerCase()], // ✅ Lowercase email
      password: validatedValues.password,
      firstName,
      lastName,
      username, // ✅ THÊM DÒNG NÀY
      publicMetadata: { role: "doctor" },
    };

    console.log("📤 SENDING TO CLERK:", {
      ...clerkPayload,
      password: "***hidden***",
    });

    let user;
    try {
      user = await client.users.createUser(clerkPayload);
      console.log("✅ CLERK USER CREATED:", user.id);
    } catch (clerkError: any) {
      console.error("❌ CLERK API ERROR:", {
        status: clerkError.status,
        errors: JSON.stringify(clerkError.errors, null, 2),
      });

      let errorMessage = "Failed to create user account";
      if (clerkError.errors && Array.isArray(clerkError.errors)) {
        errorMessage = clerkError.errors.map((e: any) => e.message).join(", ");
      }

      return {
        success: false,
        error: true,
        message: errorMessage,
      };
    }

    delete validatedValues["password"];

    const doctor = await db.doctor.create({
      data: {
        ...validatedValues,
        id: user.id,
      },
    });

    await Promise.all(
      workingDayData.map((el) =>
        db.workingDays.create({
          data: { ...el, doctor_id: doctor.id },
        })
      )
    );

    return {
      success: true,
      message: "Doctor added successfully",
      error: false,
    };
  } catch (error: any) {
    console.error("💥 ERROR:", error);
    return {
      error: true,
      success: false,
      message: error.message || "Something went wrong",
    };
  }
}

export async function createNewStaff(data: any) {
  try {
    const { userId } = await auth();

    if (!userId || !(await checkRole("ADMIN"))) {
      return { success: false, msg: "Unauthorized" };
    }

    const values = StaffSchema.safeParse(data);

    if (!values.success) {
      return {
        success: false,
        errors: true,
        message: "Please provide all required info",
      };
    }

    const validatedValues = values.data;

    const nameParts = validatedValues.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const client = await clerkClient();

    // ✅ THÊM USERNAME
    const username = validatedValues.email.split("@")[0].toLowerCase();

    let user;
    try {
      user = await client.users.createUser({
        emailAddress: [validatedValues.email.toLowerCase()], // ✅ Lowercase
        password: validatedValues.password,
        firstName,
        lastName,
        username, // ✅ THÊM DÒNG NÀY
        publicMetadata: { role: "staff" },
      });
    } catch (clerkError: any) {
      console.error("❌ CLERK API ERROR:", clerkError.errors);
      return {
        success: false,
        error: true,
        message: clerkError.errors?.[0]?.message || "Failed to create user",
      };
    }

    delete validatedValues["password"];

    await db.staff.create({
      data: {
        ...validatedValues,
        colorCode: generateRandomColor(),
        id: user.id,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      message: "Staff added successfully",
      error: false,
    };
  } catch (error: any) {
    console.error("💥 ERROR:", error);
    return {
      error: true,
      success: false,
      message: error.message || "Something went wrong",
    };
  }
}

export async function addNewService(data: any) {
  try {
    const isValidData = ServicesSchema.safeParse(data);

    const validatedData = isValidData.data;

    await db.services.create({
      data: { ...validatedData!, price: Number(data.price!) },
    });

    return {
      success: true,
      error: false,
      msg: `Service added successfully`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
