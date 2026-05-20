import { createReadingRouteHandlers } from "@/app/api/reading-proxy";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createReadingRouteHandlers(
  "/api/student/readings",
);
