import type { DashboardSnapshot } from "./model";

export const dashboardMock: DashboardSnapshot = {
  metrics: [
    { label: "Bài đang xử lý", value: "12" },
    { label: "Đã publish", value: "48" },
    { label: "Job cần xem lại", value: "2" }
  ],
  notes: ["Kết nối analytics thật trong task dashboard.", "Giữ UI trong folder feature này."]
};

