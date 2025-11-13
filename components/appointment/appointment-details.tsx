import { format } from "date-fns";
import { SmallCard } from "../small-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AppointmentDetailsProps {
  id: number | string;
  patient_id: string;
  appointment_date: Date;
  time: string;
  notes?: string;
  video_link?: string | null;
  status?: string;
}

export const AppointmentDetails = ({
  id,
  patient_id,
  appointment_date,
  time,
  notes,
  video_link,
  status,
}: AppointmentDetailsProps) => {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Appointment Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex ">
          <SmallCard label="Appointment #" value={`# ${id}`} />
          <SmallCard label="Date" value={format(appointment_date, "MMM d, yyyy")} />
          <SmallCard label="Time" value={time} />
        </div>

        <div>
          <span className="text-sm font-medium">Additional Notes</span>
          <p className="text-sm text-gray-500">{notes || "No notes"}</p>
        </div>

        {/* ✅ VIDEO CALL BUTTON (Daily.co) */}
        {video_link && status === "SCHEDULED" && (
          <div className="pt-4">
            <a
              href={`/video?url=${encodeURIComponent(video_link)}`}
              target="_blank"
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
            >
              Join Video Call
            </a>
          </div>
        )}

        {!video_link && status === "PENDING" && (
          <p className="text-xs text-gray-400 pt-2">
            Video call will be available once the appointment is approved.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
