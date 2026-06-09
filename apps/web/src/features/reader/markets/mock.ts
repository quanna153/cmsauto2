import type { Locale } from "@cmsauto/contracts";

import type { MarketCard, MarketPageContent } from "./model";

const baseSignals = [
  {
    title: "BTC giữ vùng hỗ trợ quan trọng",
    description: "Thanh khoản quanh vùng giá lớn vẫn là điểm cần theo dõi trước khi xác nhận xu hướng mới.",
    label: "Kỹ thuật",
    tone: "blue" as const,
  },
  {
    title: "Dòng tiền quay lại nhóm layer 1",
    description: "Một số token vốn hóa lớn ghi nhận nhịp hồi, nhưng biên độ vẫn phụ thuộc Bitcoin.",
    label: "Dòng tiền",
    tone: "green" as const,
  },
];

export const marketPages: Record<Locale, MarketPageContent> = {
  "vi-vn": {
    eyebrow: "Thị trường",
    heroBadge: "MARKET PULSE",
    title: "Thị trường",
    lead: "Theo dõi giá lớn, biến động nổi bật và các tín hiệu cần chú ý.",
    summary: "Dữ liệu hiện là mock typed trong feature folder.",
    meta: ["Cập nhật giả lập", "Spot market", "On-chain & macro"],
    assetsHeading: "Giá tài sản",
    assetsLinkLabel: "Tất cả",
    assets: [
      { name: "Bitcoin", symbol: "BTC", price: "$107,240", change: "+2.14%", trend: "up", bars: [35, 52, 48, 66, 72, 84] },
      { name: "Ethereum", symbol: "ETH", price: "$3,841", change: "+1.78%", trend: "up", bars: [24, 36, 40, 52, 61, 70] },
    ],
    signalsHeading: "Tín hiệu nổi bật",
    signalsDescription: "Các thẻ lớn giúp người đọc scan nhanh lực kéo chính của thị trường.",
    signals: baseSignals,
    briefsHeading: "Góc nhìn trong ngày",
    briefsLinkLabel: "Xem thêm",
    briefs: [
      {
        title: "Bitcoin vượt $107,000, tổ chức lớn tiếp tục tích lũy",
        description: "Động thái mua ròng giúp tâm lý thị trường ổn định hơn.",
        tag: "BTC",
      },
    ],
    watchHeading: "Cần theo dõi",
    watchLinkLabel: "Tuần này",
    watchItems: [
      { title: "Biến động BTC", description: "Vùng giá có khối lượng giao dịch lớn nhất trong tuần.", value: "$106K-$110K" },
    ],
    emptyTitle: "Chưa có dữ liệu thị trường",
    emptyDescription: "Danh sách market mock đang trống.",
    errorTitle: "Không tải được trang thị trường",
    errorDescription: "Vui lòng thử lại sau.",
  },
  "en-us": {
    eyebrow: "Markets",
    heroBadge: "MARKET PULSE",
    title: "Markets",
    lead: "Track major prices, standout moves and signals to watch.",
    summary: "The current dataset is typed mock content inside this feature folder.",
    meta: ["Mock updates", "Spot market", "On-chain & macro"],
    assetsHeading: "Asset prices",
    assetsLinkLabel: "All",
    assets: [
      { name: "Bitcoin", symbol: "BTC", price: "$107,240", change: "+2.14%", trend: "up", bars: [35, 52, 48, 66, 72, 84] },
      { name: "Ethereum", symbol: "ETH", price: "$3,841", change: "+1.78%", trend: "up", bars: [24, 36, 40, 52, 61, 70] },
    ],
    signalsHeading: "Featured signals",
    signalsDescription: "Large cards help readers scan the forces shaping the market.",
    signals: baseSignals,
    briefsHeading: "Daily market read",
    briefsLinkLabel: "More",
    briefs: [
      {
        title: "Bitcoin clears $107,000 as institutions keep accumulating",
        description: "Net buying supports sentiment while profit-taking risk remains.",
        tag: "BTC",
      },
    ],
    watchHeading: "Watchlist",
    watchLinkLabel: "This week",
    watchItems: [
      { title: "BTC volatility", description: "The largest traded range this week.", value: "$106K-$110K" },
    ],
    emptyTitle: "No market data yet",
    emptyDescription: "The market mock dataset is empty.",
    errorTitle: "Could not load markets",
    errorDescription: "Please try again later.",
  },
};

export const marketCards: MarketCard[] = marketPages["vi-vn"].signals.map(({ title, description }) => ({ title, description }));
