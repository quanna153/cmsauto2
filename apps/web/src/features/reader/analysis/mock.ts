import type { Locale } from "@cmsauto/contracts";
import type { AnalysisPageContent } from "./model";

export const analysisPages: Record<Locale, AnalysisPageContent> = {
  "vi-vn": {
    eyebrow: "Phân tích",
    heroBadge: "DEEP DIVE",
    title: "Phân tích",
    lead:
      "Trang phân tích gom các luận điểm thị trường, dữ liệu xác nhận và rủi ro cần theo dõi để người đọc đi sâu hơn sau khi xem tin nhanh.",
    summary:
      "Nội dung hiện là mock typed trong feature folder. Adapter giữ ranh giới để sau này nối dữ liệu thật mà không đổi route hoặc chạm API ngoài scope.",
    meta: ["Luận điểm rõ", "Dữ liệu hỗ trợ", "Kịch bản rủi ro"],
    thesisHeading: "Luận điểm nổi bật",
    thesisDescription:
      "Mỗi thẻ phân tích được viết như một giả thuyết có thể kiểm chứng, không phải lời khuyên đầu tư.",
    theses: [
      {
        label: "BTC",
        title: "Vùng $106K-$110K quyết định nhịp rủi ro ngắn hạn",
        description:
          "Nếu thanh khoản tiếp tục hấp thụ lực bán, thị trường có thể giữ cấu trúc tích lũy trước nhịp biến động mới.",
        confidence: "Cao",
        tone: "blue",
      },
      {
        label: "Altcoin",
        title: "Dòng tiền altcoin chưa đủ rộng",
        description:
          "Một số nhóm dẫn dắt hồi phục, nhưng breadth toàn thị trường vẫn cần cải thiện để xác nhận rotation bền hơn.",
        confidence: "Trung bình",
        tone: "green",
      },
      {
        label: "Macro",
        title: "Lãi suất vẫn là biến số chính",
        description:
          "Các phiên Mỹ có thể tạo nhiễu lớn khi dữ liệu lợi suất và kỳ vọng chính sách thay đổi nhanh.",
        confidence: "Theo dõi",
        tone: "amber",
      },
      {
        label: "On-chain",
        title: "Holder dài hạn chưa phân phối mạnh",
        description:
          "Dòng coin cũ chưa di chuyển đáng kể, nhưng tín hiệu này cần đọc cùng volume sàn và funding.",
        confidence: "Ổn định",
        tone: "violet",
      },
    ],
    reportsHeading: "Báo cáo phân tích",
    reportsLinkLabel: "Xem thêm",
    reports: [
      {
        title: "Cá voi gom BTC ở vùng $100K-$105K trong 30 ngày qua",
        description:
          "Dữ liệu ví lớn cho thấy tích lũy vẫn diễn ra, nhưng áp lực chốt lời ngắn hạn tăng khi giá tiếp cận đỉnh cũ.",
        tag: "On-chain",
        readTime: "8 phút",
        author: "Lê Quỳnh Anh",
      },
      {
        title: "Stablecoin supply tăng trở lại: tín hiệu sớm hay nhiễu ngắn hạn?",
        description:
          "Nguồn cung stablecoin mở rộng thường hỗ trợ thanh khoản, nhưng cần kiểm tra dòng tiền vào sàn và DeFi.",
        tag: "Liquidity",
        readTime: "7 phút",
        author: "Nguyễn Minh Tuấn",
      },
      {
        title: "AI token sau nhịp điều chỉnh: nhóm nào giữ được doanh thu thật?",
        description:
          "Narrative AI vẫn mạnh, nhưng chất lượng dự án thể hiện rõ hơn qua phí giao thức, user thật và runway.",
        tag: "Narrative",
        readTime: "9 phút",
        author: "Phạm Huy",
      },
      {
        title: "Ethereum staking và rủi ro tập trung validator",
        description:
          "Staking đơn giản hơn giúp mở rộng người dùng, đồng thời đặt ra câu hỏi về phân phối validator.",
        tag: "ETH",
        readTime: "6 phút",
        author: "Mai An",
      },
    ],
    indicatorsHeading: "Chỉ báo theo dõi",
    indicatorsLinkLabel: "Hôm nay",
    indicators: [
      {
        label: "BTC dominance",
        value: "54.2%",
        description: "Dominance cao cho thấy altcoin vẫn phụ thuộc nhịp dẫn của Bitcoin.",
        trend: "neutral",
      },
      {
        label: "Funding rate",
        value: "0.012%",
        description: "Đòn bẩy chưa quá nóng, nhưng có thể tăng nhanh nếu giá phá vùng trên.",
        trend: "up",
      },
      {
        label: "Stablecoin flow",
        value: "+$1.4B",
        description: "Dòng tiền mới hỗ trợ thanh khoản nhưng chưa đủ để xác nhận risk-on toàn diện.",
        trend: "up",
      },
    ],
    risksHeading: "Kịch bản rủi ro",
    risksLinkLabel: "Cần nhớ",
    risks: [
      {
        marker: "01",
        title: "Phá vỡ hỗ trợ với volume cao",
        description: "Nếu BTC mất vùng hỗ trợ chính, các luận điểm tích lũy cần được đánh giá lại.",
      },
      {
        marker: "02",
        title: "Funding tăng quá nhanh",
        description: "Đòn bẩy dày có thể làm biến động bị khuếch đại và quét vị thế trước khi xu hướng tiếp tục.",
      },
      {
        marker: "03",
        title: "Tin macro đảo chiều",
        description: "Dữ liệu lãi suất, USD và lợi suất trái phiếu có thể làm tín hiệu crypto ngắn hạn mất hiệu lực.",
      },
    ],
    metricsHeading: "Khung đọc",
    metrics: [
      { label: "Luận điểm", value: "4", detail: "BTC, altcoin, macro và on-chain" },
      { label: "Báo cáo", value: "4", detail: "Mỗi báo cáo có tag, tác giả và thời lượng đọc" },
      { label: "Rủi ro", value: "3", detail: "Kịch bản vô hiệu để tránh đọc một chiều" },
    ],
    emptyTitle: "Chưa có dữ liệu phân tích",
    emptyDescription: "Danh sách analysis mock đang trống. Hãy bổ sung typed mock trong feature folder này.",
    errorTitle: "Không tải được trang phân tích",
    errorDescription: "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/analysis.",
  },
  "en-us": {
    eyebrow: "Analysis",
    heroBadge: "DEEP DIVE",
    title: "Analysis",
    lead:
      "The analysis page brings market theses, confirming data and risk scenarios into one deeper view after readers scan the news flow.",
    summary:
      "The current dataset is typed mock content inside this feature folder. The adapter keeps the boundary ready for a future data source without touching routes or APIs.",
    meta: ["Clear theses", "Supporting data", "Risk scenarios"],
    thesisHeading: "Featured theses",
    thesisDescription:
      "Each analysis card is framed as a testable hypothesis, not investment advice.",
    theses: [
      {
        label: "BTC",
        title: "The $106K-$110K zone drives short-term risk appetite",
        description:
          "If liquidity keeps absorbing sell pressure, the market may hold an accumulation structure before a new volatility move.",
        confidence: "High",
        tone: "blue",
      },
      {
        label: "Altcoins",
        title: "Altcoin flows are not broad enough yet",
        description:
          "Some leading groups are recovering, but market breadth still needs to improve before a durable rotation is confirmed.",
        confidence: "Medium",
        tone: "green",
      },
      {
        label: "Macro",
        title: "Rates remain the key swing factor",
        description:
          "US sessions may stay noisy when yields and policy expectations change quickly.",
        confidence: "Watch",
        tone: "amber",
      },
      {
        label: "On-chain",
        title: "Long-term holders are not distributing aggressively",
        description:
          "Older coins have not moved heavily, but this signal should be read with exchange volume and funding.",
        confidence: "Stable",
        tone: "violet",
      },
    ],
    reportsHeading: "Research reports",
    reportsLinkLabel: "More",
    reports: [
      {
        title: "Whales accumulated BTC around $100K-$105K over the past 30 days",
        description:
          "Large-wallet data suggests accumulation continues, but short-term profit-taking risk rises near prior highs.",
        tag: "On-chain",
        readTime: "8 min",
        author: "Le Quynh Anh",
      },
      {
        title: "Stablecoin supply is rising again: early signal or short-term noise?",
        description:
          "Expanding stablecoin supply often supports liquidity, but exchange and DeFi flows still need confirmation.",
        tag: "Liquidity",
        readTime: "7 min",
        author: "Nguyen Minh Tuan",
      },
      {
        title: "AI tokens after the pullback: which projects keep real revenue?",
        description:
          "The AI narrative remains strong, but protocol fees, real users and runway separate quality projects.",
        tag: "Narrative",
        readTime: "9 min",
        author: "Pham Huy",
      },
      {
        title: "Ethereum staking and validator concentration risk",
        description:
          "Simpler staking expands access while raising questions about validator distribution.",
        tag: "ETH",
        readTime: "6 min",
        author: "Mai An",
      },
    ],
    indicatorsHeading: "Indicators to watch",
    indicatorsLinkLabel: "Today",
    indicators: [
      {
        label: "BTC dominance",
        value: "54.2%",
        description: "High dominance shows altcoins still depend on Bitcoin leadership.",
        trend: "neutral",
      },
      {
        label: "Funding rate",
        value: "0.012%",
        description: "Leverage is not overheated, but can rise quickly if price breaks the upper range.",
        trend: "up",
      },
      {
        label: "Stablecoin flow",
        value: "+$1.4B",
        description: "Fresh liquidity helps, but is not enough to confirm broad risk-on behavior.",
        trend: "up",
      },
    ],
    risksHeading: "Risk scenarios",
    risksLinkLabel: "Remember",
    risks: [
      {
        marker: "01",
        title: "High-volume support break",
        description: "If BTC loses the key support zone, accumulation theses need to be reviewed.",
      },
      {
        marker: "02",
        title: "Funding rises too quickly",
        description: "Crowded leverage can amplify volatility and force liquidations before trend continuation.",
      },
      {
        marker: "03",
        title: "Macro data reverses",
        description: "Rates, USD and bond yields can invalidate short-term crypto signals.",
      },
    ],
    metricsHeading: "Reading frame",
    metrics: [
      { label: "Theses", value: "4", detail: "BTC, altcoins, macro and on-chain" },
      { label: "Reports", value: "4", detail: "Each report has a tag, author and read time" },
      { label: "Risks", value: "3", detail: "Invalidation scenarios to avoid one-sided reads" },
    ],
    emptyTitle: "No analysis data yet",
    emptyDescription: "The analysis mock dataset is empty. Add typed content inside this feature folder.",
    errorTitle: "Could not load analysis",
    errorDescription: "Please try again later or check the reader/analysis adapter.",
  },
};

export const analysisCards = analysisPages["vi-vn"].theses.map(({ title, description }) => ({ title, description }));
