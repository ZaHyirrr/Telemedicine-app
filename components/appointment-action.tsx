"use client";

import { AppointmentStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { appointmentAction } from "@/app/actions/appointment";


interface ActionProps {
  id: string | number;
  status: string;
}

export const AppointmentAction = ({ id, status }: ActionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleAction = async () => {
    if (!selected) {
      toast.error("Please select an action first!");
      return;
    }

    try {
      setIsLoading(true);

      const newReason =
        reason ||
        `Appointment has been ${selected.toLowerCase()} on ${new Date().toLocaleString()}`;

      const resp = await appointmentAction(
        id,
        selected as AppointmentStatus,
        newReason
      );

      // ✅ BACKEND CHỈ RETURN success / msg
      if (resp.success) {
        toast.success(resp.msg);
        router.refresh();
      } else {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ===========================
     Check Disable Conditions
  ============================ */
  const isPendingDisabled =
    status === "PENDING" || isLoading || status === "COMPLETED";

  const isApproveDisabled =
    status === "SCHEDULED" || isLoading || status === "COMPLETED";

  const isCompleteDisabled =
    status === "COMPLETED" || isLoading;

  const isCancelDisabled =
    status === "CANCELLED" || isLoading || status === "COMPLETED";

  return (
    <div>
      {/* ACTION BUTTONS */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          disabled={isPendingDisabled}
          className="bg-yellow-200 text-black"
          onClick={() => setSelected("PENDING")}
        >
          Pending
        </Button>

        <Button
          variant="outline"
          disabled={isApproveDisabled}
          className="bg-blue-200 text-black"
          onClick={() => setSelected("SCHEDULED")}
        >
          Approve
        </Button>

        <Button
          variant="outline"
          disabled={isCompleteDisabled}
          className="bg-emerald-200 text-black"
          onClick={() => setSelected("COMPLETED")}
        >
          Completed
        </Button>

        <Button
          variant="outline"
          disabled={isCancelDisabled}
          className="bg-red-200 text-black"
          onClick={() => setSelected("CANCELLED")}
        >
          Cancel
        </Button>
      </div>

      {/* TEXTAREA FOR CANCEL REASON */}
      {selected === "CANCELLED" && (
        <Textarea
          disabled={isLoading}
          className="mt-4"
          placeholder="Enter cancellation reason..."
          onChange={(e) => setReason(e.target.value)}
        />
      )}

      {/* CONFIRMATION BOX */}
      {selected && (
        <div className="flex items-center justify-between mt-6 bg-red-100 p-4 rounded">
          <p>Are you sure you want to perform this action?</p>
          <Button disabled={isLoading} type="button" onClick={handleAction}>
            Yes
          </Button>
        </div>
      )}
    </div>
  );
};
