import db from "@/lib/db";
import RatingList from "./rating-list";

export async function DoctorRatingContainer({
  doctorId,
}: {
  doctorId: string;
}) {
  if (!doctorId) return null;

  const reviews = await db.rating.findMany({
    where: { doctor_id: doctorId },
    include: {
      patient: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg text-gray-500 shadow-sm mt-6">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm mt-6">
      <h2 className="text-lg font-semibold mb-3">Patient Reviews</h2>
      <RatingList data={reviews} />
    </div>
  );
}
