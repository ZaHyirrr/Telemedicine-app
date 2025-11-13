import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import React from "react";
import RatingStars from "./rating-stars";

export const PatientRatingContainer = async () => {
  const { userId } = await auth();

  const reviews = await db.rating.findMany({
    where: { patient_id: userId! },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm text-gray-500 text-sm">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">Your Reviews</h2>

      {reviews.map((r) => (
        <div
          key={r.id}
          className="border p-4 rounded-lg shadow-sm mb-3 bg-white"
        >
          {/* ⭐ rating */}
          <RatingStars value={r.rating} />

          {/* 👨‍⚕️ doctor name */}
          <p className="text-sm font-semibold mt-1">
            Doctor: <span className="text-blue-600">{r.doctor?.name}</span>
          </p>

          {/* comment */}
          <p className="mt-2 text-gray-700">{r.comment}</p>

          {/* date */}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(r.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};
