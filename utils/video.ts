// utils/video.ts (Free Jitsi Version ✅)

export function generateVideoRoom(appointmentId: number) {
  const roomName = `appt_${appointmentId}_${Date.now()}`;

  // ✅ Free, no API key, no backend request
  return `https://meet.jit.si/${roomName}`;
}
