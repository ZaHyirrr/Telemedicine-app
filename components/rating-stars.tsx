"use client";

import { StarIcon } from "lucide-react";

export default function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          size={20}
          className={
            star <= value
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}
