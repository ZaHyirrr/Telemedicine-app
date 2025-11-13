import RatingStars from "./rating-stars";

export default function RatingList({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold">
              {item.patient?.first_name} {item.patient?.last_name}
            </p>
            <RatingStars value={item.rating} />
          </div>

          <p className="text-sm text-gray-600 mt-2">{item.comment}</p>

          <span className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleDateString("vi-VN")}
          </span>
        </div>
      ))}
    </div>
  );
}
