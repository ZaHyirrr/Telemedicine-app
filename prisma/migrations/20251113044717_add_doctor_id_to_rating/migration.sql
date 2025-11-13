/*
  Warnings:

  - You are about to drop the column `staff_id` on the `Rating` table. All the data in the column will be lost.
  - Added the required column `doctor_id` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('SENT', 'CONFIRMED', 'DISPENSED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_staff_id_fkey";

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "staff_id",
ADD COLUMN     "doctor_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER,
    "doctor_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "pharmacy_id" TEXT,
    "medicines" JSONB NOT NULL,
    "note" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
