import type { Locale } from "@cmsauto/contracts";
import type { MarketPageContent } from "./model";

export const marketPages: Record<Locale, MarketPageContent> = {
  "vi-vn": {
    eyebrow: "Thị trường",
    heroBadge: "MARKET PULSE",
    title: "Thị trường",
    lead:
      "Trang thị trường gom giá lớn, biến động nổi bật và các tín hiệu cần chú ý để người đọc nắm bối cảnh trước khi đi sâu vào từng bài phân tích.",
    summary:
      "Dữ liệu hiện là mock typed trong feature folder. Adapter giữ ranh giới để sau này nối feed thật mà không đổi route hoặc chạm API ngoài scope.",
    meta: ["Cập nhật giả lập", "Spot market", "On-chain & macro"],
    assetsHeading: "Giá tài sản",
    assetsLinkLabel: "Tất cả",
    assets: [
      { name: "Bitcoin", symbol: "BTC", price: "$107,240", change: "+2.14%", trend: "up", bars: [35, 52, 48, 66, 72, 84] },
      { name: "Ethereum", symbol: "ETH", price: "$3,841", change: "+1.78%", trend: "up", bars: [24, 36, 40, 52, 61, 70] },
      { name: "BNB", symbol: "BNB", price: "$682", change: "-0.41%", trend: "down", bars: [70, 62, 58, 48, 44, 38] },
      { name: "Solana", symbol: "SOL", price: "$175.4", change: "+3.25%", trend: "up", bars: [30, 45, 42, 58, 76, 88] },
      { name: "XRP", symbol: "XRP", price: "$0.618", change: "-1.08%", trend: "down", bars: [64, 59, 51, 49, 42, 36] },
    ],
    signalsHeading: "Tín hiệu nổi bật",
    signalsDescription:
      "Các thẻ lớn giúp người đọc scan nhanh những lực kéo chính của thị trường trong ngày.",
    signals: [
      {
        title: "BTC giữ vùng hỗ trợ quan trọng",
        description: "Thanh khoản quanh vùng giá lớn vẫn là điểm cần theo dõi trước khi xác nhận xu hướng mới.",
        label: "Kỹ thuật",
        tone: "blue",
      },
      {
        title: "Dòng tiền quay lại nhóm layer 1",
        description: "Một số token vốn hóa lớn ghi nhận nhịp hồi, nhưng biên độ vẫn phụ thuộc Bitcoin.",
        label: "Dòng tiền",
        tone: "green",
      },
      {
        title: "Macro tiếp tục tạo nhiễu",
        description: "Lợi suất và kỳ vọng lãi suất có thể làm biến động tăng trong các phiên Mỹ.",
        label: "Macro",
        tone: "amber",
      },
      {
        title: "AI token phân hóa mạnh",
        description: "Nhóm dẫn dắt giữ được lực mua, trong khi các mã nhỏ cần thêm xác nhận thanh khoản.",
        label: "Narrative",
        tone: "violet",
      },
    ],
    briefsHeading: "Góc nhìn trong ngày",
    briefsLinkLabel: "Xem thêm",
    briefs: [
      {
        title: "Bitcoin vượt $107,000, tổ chức lớn tiếp tục tích lũy trước chu kỳ mới",
        description: "Động thái mua ròng giúp tâm lý thị trường ổn định hơn nhưng rủi ro chốt lời vẫn còn.",
        tag: "BTC",
      },
      {
        title: "Ethereum thêm tín hiệu staking tự động cho người dùng mới",
        description: "Các sản phẩm đơn giản hóa staking có thể mở rộng tệp người dùng phổ thông.",
        tag: "ETH",
      },
      {
        title: "Solana và Ethereum: ai thắng cuộc chiến layer-1 năm 2026?",
        description: "Cuộc cạnh tranh chuyển từ phí giao dịch sang hệ sinh thái ứng dụng và độ bền doanh thu.",
        tag: "L1",
      },
      {
        title: "Thanh khoản stablecoin tăng trở lại",
        description: "Tín hiệu này thường đi trước các nhịp mở rộng rủi ro, nhưng cần theo dõi dòng tiền vào sàn.",
        tag: "Flow",
      },
    ],
    watchHeading: "Cần theo dõi",
    watchLinkLabel: "Tuần này",
    watchItems: [
      { title: "Biến động BTC", description: "Vùng giá có khối lượng giao dịch lớn nhất trong tuần.", value: "$106K-$110K" },
      { title: "Dominance", description: "Tỷ trọng BTC có thể quyết định nhịp altcoin tiếp theo.", value: "54.2%" },
      { title: "Funding rate", description: "Đòn bẩy phái sinh tăng nhanh sẽ làm rủi ro quét vị thế cao hơn.", value: "Trung tính" },
    ],
    emptyTitle: "Chưa có dữ liệu thị trường",
    emptyDescription: "Danh sách market mock đang trống. Hãy bổ sung dữ liệu typed trong feature folder này.",
    errorTitle: "Không tải được trang thị trường",
    errorDescription: "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/markets.",
  },
  "en-us": {
    eyebrow: "Markets",
    heroBadge: "MARKET PULSE",
    title: "Markets",
    lead:
      "The markets page brings major prices, standout moves and watch signals into a compact view before readers open deeper analysis.",
    summary:
      "The current dataset is typed mock content inside this feature folder. The adapter keeps the boundary ready for a future data feed without changing the route.",
    meta: ["Mock updates", "Spot market", "On-chain & macro"],
    assetsHeading: "Asset prices",
    assetsLinkLabel: "All",
    assets: [
      { name: "Bitcoin", symbol: "BTC", price: "$107,240", change: "+2.14%", trend: "up", bars: [35, 52, 48, 66, 72, 84] },
      { name: "Ethereum", symbol: "ETH", price: "$3,841", change: "+1.78%", trend: "up", bars: [24, 36, 40, 52, 61, 70] },
      { name: "BNB", symbol: "BNB", price: "$682", change: "-0.41%", trend: "down", bars: [70, 62, 58, 48, 44, 38] },
      { name: "Solana", symbol: "SOL", price: "$175.4", change: "+3.25%", trend: "up", bars: [30, 45, 42, 58, 76, 88] },
      { name: "XRP", symbol: "XRP", price: "$0.618", change: "-1.08%", trend: "down", bars: [64, 59, 51, 49, 42, 36] },
    ],
    signalsHeading: "Featured signals",
    signalsDescription: "Large cards help readers scan the forces shaping the market today.",
    signals: [
      {
        title: "BTC holds a key support zone",
        description: "Liquidity around the major range remains the point to watch before trend confirmation.",
        label: "Technical",
        tone: "blue",
      },
      {
        title: "Flows return to layer-1 assets",
        description: "Several large-cap tokens are rebounding, though the move still depends on Bitcoin.",
        label: "Flows",
        tone: "green",
      },
      {
        title: "Macro keeps volatility elevated",
        description: "Yields and rate expectations may increase swings during US trading hours.",
        label: "Macro",
        tone: "amber",
      },
      {
        title: "AI tokens split into leaders and laggards",
        description: "Leaders keep bid support while smaller tokens need more liquidity confirmation.",
        label: "Narrative",
        tone: "violet",
      },
    ],
    briefsHeading: "Daily market read",
    briefsLinkLabel: "More",
    briefs: [
      {
        title: "Bitcoin clears $107,000 as institutions continue to accumulate",
        description: "Net buying supports sentiment, but profit-taking risk remains near the upper range.",
        tag: "BTC",
      },
      {
        title: "Ethereum adds simpler automated staking flows",
        description: "Simplified staking products may expand access for mainstream users.",
        tag: "ETH",
      },
      {
        title: "Solana vs Ethereum: who leads layer-1 activity in 2026?",
        description: "Competition is shifting from fees to application ecosystems and durable revenue.",
        tag: "L1",
      },
      {
        title: "Stablecoin liquidity starts rising again",
        description: "This can precede risk expansion, but exchange inflows still need confirmation.",
        tag: "Flow",
      },
    ],
    watchHeading: "Watchlist",
    watchLinkLabel: "This week",
    watchItems: [
      { title: "BTC volatility", description: "The range with the largest traded volume this week.", value: "$106K-$110K" },
      { title: "Dominance", description: "BTC share may decide the next altcoin rotation.", value: "54.2%" },
      { title: "Funding rate", description: "Fast leverage growth increases liquidation risk.", value: "Neutral" },
    ],
    emptyTitle: "No market data yet",
    emptyDescription: "The market mock dataset is empty. Add typed data inside this feature folder.",
    errorTitle: "Could not load markets",
    errorDescription: "Please try again later or check the reader/markets adapter.",
  },
};

export const marketCards = marketPages["vi-vn"].signals.map(({ title, description }) => ({ title, description }));
