export type TickerItem = {
  symbol: string;
  price: string;
  change: string;
  direction: "up" | "down";
};

export type NewsCard = {
  title: string;
  category: string;
  meta: string;
  tone: string;
  icon: string;
};

export type RankedNews = {
  title: string;
  meta: string;
  tag: string;
  tagTone: "hot" | "new" | "law";
};

export type AnalysisCard = {
  label: string;
  labelTone: string;
  title: string;
  meta: string;
};

export type MarketRow = {
  name: string;
  symbol: string;
  price: string;
  change: string;
  direction: "up" | "down";
  color: string;
  bars: Array<"low" | "mid" | "high" | "up" | "down">;
};

export type SidebarPost = {
  title: string;
  meta: string;
};

export const marketTicker: TickerItem[] = [
  { symbol: "BTC", price: "$107,240", change: "+2.14%", direction: "up" },
  { symbol: "ETH", price: "$3,841", change: "+1.87%", direction: "up" },
  { symbol: "BNB", price: "$682", change: "-0.43%", direction: "down" },
  { symbol: "SOL", price: "$175.2", change: "+3.21%", direction: "up" },
  { symbol: "XRP", price: "$0.618", change: "-1.02%", direction: "down" },
  { symbol: "ADA", price: "$0.452", change: "+0.76%", direction: "up" }
];

export const categories = ["Tất cả", "Bitcoin", "Ethereum", "DeFi", "Altcoin", "Pháp lý VN", "Macro"];

export const newsCards: NewsCard[] = [
  {
    title: "BTC: RSI thoát vùng quá mua, mục tiêu tiếp theo $115,000?",
    category: "Phân tích kỹ thuật",
    meta: "1 giờ trước · 4 phút đọc",
    tone: "bg-[#07110c] text-[#22c55e]",
    icon: "△"
  },
  {
    title: "Bộ Tài chính ban hành khung thuế tài sản mã hóa có hiệu lực",
    category: "Pháp lý Việt Nam",
    meta: "3 giờ trước · 6 phút đọc",
    tone: "bg-[#f1fbf4] text-[#047857]",
    icon: "§"
  },
  {
    title: "Uniswap v5 ra mắt: liquidity tập trung thế hệ mới",
    category: "DeFi",
    meta: "5 giờ trước · 3 phút đọc",
    tone: "bg-white text-[#111827]",
    icon: "✦"
  },
  {
    title: "Sàn giao dịch nội địa tăng vốn, đẩy mạnh sản phẩm cho nhà đầu tư",
    category: "Thị trường VN",
    meta: "7 giờ trước · 5 phút đọc",
    tone: "bg-[#07110c] text-[#22c55e]",
    icon: "AI"
  }
];

export const readMost: RankedNews[] = [
  {
    title: "Việt Nam đứng thứ 3 thế giới về lượng người dùng crypto",
    meta: "12,400 lượt đọc · 4 giờ trước",
    tag: "Hot",
    tagTone: "hot"
  },
  {
    title: "Hướng dẫn khai thuế tài sản mã hóa theo khung mới",
    meta: "9,800 lượt đọc · 6 giờ trước",
    tag: "Pháp lý",
    tagTone: "law"
  },
  {
    title: "Top 5 altcoin tiềm năng theo các chuyên gia phân tích",
    meta: "7,300 lượt đọc · 8 giờ trước",
    tag: "Hot",
    tagTone: "hot"
  },
  {
    title: "Ethereum thêm tính năng staking tự động cho người dùng mới",
    meta: "5,600 lượt đọc · 11 giờ trước",
    tag: "Mới",
    tagTone: "new"
  },
  {
    title: "Cảnh báo lừa đảo: mạo danh sàn giao dịch để chiếm đoạt tài sản",
    meta: "4,900 lượt đọc · 14 giờ trước",
    tag: "Cảnh báo",
    tagTone: "hot"
  }
];

export const analysisCards: AnalysisCard[] = [
  {
    label: "On-chain",
    labelTone: "text-[#047857]",
    title: "Cá voi gom BTC ở vùng $100K-$105K trong 30 ngày qua",
    meta: "Trần Hữu Đức · Hôm qua · 8 phút"
  },
  {
    label: "Macro",
    labelTone: "text-[#047857]",
    title: "FED giữ nguyên lãi suất và tác động đến thị trường crypto ASEAN",
    meta: "Lê Quỳnh Anh · 2 ngày trước · 10 phút"
  }
];

export const marketRows: MarketRow[] = [
  { name: "Bitcoin", symbol: "BTC", price: "$107,240", change: "+2.14%", direction: "up", color: "#07110c", bars: ["low", "mid", "low", "up", "up"] },
  { name: "Ethereum", symbol: "ETH", price: "$3,841", change: "+1.87%", direction: "up", color: "#07110c", bars: ["mid", "up", "mid", "up", "up"] },
  { name: "BNB", symbol: "BNB", price: "$682", change: "-0.43%", direction: "down", color: "#07110c", bars: ["high", "mid", "down", "down", "down"] },
  { name: "Solana", symbol: "SOL", price: "$175.2", change: "+3.21%", direction: "up", color: "#07110c", bars: ["low", "mid", "up", "up", "up"] },
  { name: "XRP", symbol: "XRP", price: "$0.618", change: "-1.02%", direction: "down", color: "#07110c", bars: ["high", "down", "down", "low", "down"] }
];

export const hotPosts: SidebarPost[] = [
  { title: "Phân tích on-chain: Vì sao BTC khó giảm sâu dưới $95K?", meta: "Phân tích · 3,200 lượt xem" },
  { title: "DeFi 2026: Giao thức nào đang dẫn đầu TVL tại Việt Nam?", meta: "Kiến thức · 2,800 lượt xem" },
  { title: "Solana vs Ethereum: Ai thắng cuộc chiến Layer-1 năm 2026?", meta: "Phân tích · 2,400 lượt xem" },
  { title: "Cách đọc báo cáo on-chain để xác định đáy thị trường", meta: "Kiến thức · 1,900 lượt xem" }
];

export const latestPosts: SidebarPost[] = [
  { title: "Bitcoin là gì? Giải thích cho người mới bắt đầu", meta: "Kiến thức cơ bản · Hôm qua" },
  { title: "Đọc biểu đồ nến Nhật từ cơ bản đến nâng cao", meta: "Kiến thức · 2 ngày trước" },
  { title: "Cách tạo và bảo mật ví crypto an toàn 2026", meta: "Hướng dẫn · 3 ngày trước" }
];
