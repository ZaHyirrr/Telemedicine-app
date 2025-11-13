import { z } from "zod";

export const reviewSchema = z.object({
  patient_id: z.string(),
  doctor_id: z.string(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1).max(500),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
