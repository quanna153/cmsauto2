import type { Locale } from "@cmsauto/contracts";
import type { AboutPageContent } from "./model";

export const aboutPages: Record<Locale, AboutPageContent> = {
  "vi-vn": {
    eyebrow: "Về chúng tôi",
    heroBadge: "COINVIEW",
    title: "Về CMS Auto",
    lead:
      "CoinView biến dòng dữ liệu thị trường, kiến thức và phân tích thành những bản tin dễ đọc, có ngữ cảnh và hữu ích cho quyết định mỗi ngày.",
    summary:
      "Chúng tôi xây dựng một phòng tin tức gọn, minh bạch và có kỷ luật: ưu tiên số liệu, tách bạch nhận định với sự kiện, và luôn đặt rủi ro của người đọc lên trước.",
    meta: ["Cập nhật mỗi ngày", "Song ngữ", "Tập trung thị trường Việt"],
    metrics: [
      { label: "Chuyên mục", value: "5", detail: "Tin tức, thị trường, kiến thức, phân tích và hướng dẫn" },
      { label: "Nguyên tắc", value: "4", detail: "Dữ liệu, ngữ cảnh, cảnh báo rủi ro và ngôn ngữ dễ hiểu" },
      { label: "Mục tiêu", value: "1", detail: "Giúp người đọc đọc nhanh hơn nhưng hiểu sâu hơn" },
    ],
    pillarsHeading: "Chúng tôi tập trung vào điều gì",
    pillarsDescription:
      "Trang giới thiệu cần cho thấy CoinView không chỉ là một trang tin, mà là một bộ lọc thông tin cho người theo dõi tài sản số.",
    pillars: [
      {
        eyebrow: "Thị trường",
        title: "Đọc tin có ngữ cảnh",
        description:
          "Mỗi biến động giá được đặt cạnh dòng tiền, tâm lý thị trường và các mốc rủi ro để người đọc không chỉ thấy con số.",
        tone: "blue",
        marker: "01",
      },
      {
        eyebrow: "Kiến thức",
        title: "Giải thích thuật ngữ khó",
        description:
          "Nội dung được viết lại bằng ngôn ngữ thực tế, tránh cảm giác học thuật nhưng vẫn giữ độ chính xác cần thiết.",
        tone: "green",
        marker: "02",
      },
      {
        eyebrow: "Phân tích",
        title: "Tách tín hiệu khỏi nhiễu",
        description:
          "Các bài phân tích ưu tiên cấu trúc rõ: giả thuyết, dữ liệu ủng hộ, kịch bản thay thế và điều kiện vô hiệu.",
        tone: "amber",
        marker: "03",
      },
      {
        eyebrow: "Cộng đồng",
        title: "Tôn trọng người đọc mới",
        description:
          "CoinView viết cho cả người mới bắt đầu lẫn người đọc đã theo dõi thị trường, nên mỗi bài cần có điểm vào rõ ràng.",
        tone: "violet",
        marker: "04",
      },
    ],
    principlesHeading: "Nguyên tắc biên tập",
    principlesLinkLabel: "Xem thêm",
    principles: [
      {
        title: "Không biến headline thành lời khuyên đầu tư",
        description: "Tiêu đề cần nội dung, không phóng đại lợi nhuận hoặc thao túng cảm xúc sợ mất cơ hội.",
        tag: "Minh bạch",
      },
      {
        title: "Nêu rõ đâu là sự kiện, đâu là nhận định",
        description: "Người đọc phải nhận ra phần nào là dữ liệu đã xảy ra và phần nào là cách diễn giải của tác giả.",
        tag: "Rạch mạch",
      },
      {
        title: "Nhắc rủi ro khi nói về cơ hội",
        description: "Mỗi câu chuyện tăng trưởng đều cần cảnh báo biến động, thanh khoản và giới hạn của dữ liệu.",
        tag: "Cân bằng",
      },
      {
        title: "Viết gọn nhưng không cắt mất ngữ cảnh",
        description: "Bài viết ưu tiên scan nhanh, nhưng vẫn giữ đủ thông tin để người đọc tự kiểm chứng tiếp.",
        tag: "Hữu ích",
      },
    ],
    workflowHeading: "Cách một bài viết được hình thành",
    workflowLinkLabel: "Quy trình",
    workflow: [
      {
        title: "Chọn tín hiệu",
        description: "Lọc chủ đề từ giá, dòng tiền, on-chain, pháp lý và câu hỏi đang lặp lại trong cộng đồng.",
      },
      {
        title: "Kiểm tra ngữ cảnh",
        description: "Đối chiếu với dữ liệu lịch sử, nguồn gốc sự kiện và những điểm chưa chắc chắn.",
      },
      {
        title: "Viết bản dễ đọc",
        description: "Biến thông tin phức tạp thành cấu trúc rõ: điểm chính, vì sao quan trọng, cần theo dõi gì tiếp.",
      },
    ],
    teamHeading: "Đội ngũ & cam kết",
    teamNotes: [
      {
        title: "Độc giả là trung tâm",
        description: "Mỗi màn hình ưu tiên khả năng scan nhanh trên mobile và desktop, giống cách người đọc theo dõi thị trường.",
      },
      {
        title: "Không bán tín hiệu mua bán",
        description: "CoinView cung cấp thông tin và phân tích; quyết định đầu tư luôn thuộc về người đọc.",
      },
      {
        title: "Mở rộng có kỷ luật",
        description: "Nội dung mock hiện nằm trong adapter typed để sau này thay bằng API mà không đổi UI route.",
      },
    ],
    emptyTitle: "Chưa có nội dung giới thiệu",
    emptyDescription: "Dữ liệu about đang trống. Hãy bổ sung typed mock trong feature folder này.",
    errorTitle: "Không tải được trang giới thiệu",
    errorDescription: "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/about.",
  },
  "en-us": {
    eyebrow: "About us",
    heroBadge: "COINVIEW",
    title: "Về CMS Auto",
    lead:
      "CoinView turns market data, education and analysis into concise stories that help readers understand what matters before they act.",
    summary:
      "We are building a disciplined newsroom for digital assets: data first, clear separation between facts and interpretation, and risk awareness in every story.",
    meta: ["Daily updates", "Bilingual coverage", "Vietnam-focused context"],
    metrics: [
      { label: "Sections", value: "5", detail: "News, markets, education, analysis and guides" },
      { label: "Principles", value: "4", detail: "Data, context, risk notes and plain language" },
      { label: "Goal", value: "1", detail: "Help readers scan faster and understand deeper" },
    ],
    pillarsHeading: "What we focus on",
    pillarsDescription:
      "The about page should make CoinView feel like a thoughtful information filter, not just another crypto news feed.",
    pillars: [
      {
        eyebrow: "Markets",
        title: "News with context",
        description:
          "Price moves are framed with flows, sentiment and risk levels so readers see more than the latest number.",
        tone: "blue",
        marker: "01",
      },
      {
        eyebrow: "Education",
        title: "Plain-language explainers",
        description:
          "Complex terms are rewritten in practical language while keeping the accuracy readers need.",
        tone: "green",
        marker: "02",
      },
      {
        eyebrow: "Analysis",
        title: "Signal over noise",
        description:
          "Analysis follows a clear structure: thesis, supporting data, alternate scenarios and invalidation points.",
        tone: "amber",
        marker: "03",
      },
      {
        eyebrow: "Community",
        title: "Respect new readers",
        description: "Each story gives both beginners and active market watchers a clear entry point.",
        tone: "violet",
        marker: "04",
      },
    ],
    principlesHeading: "Editorial principles",
    principlesLinkLabel: "More",
    principles: [
      {
        title: "Never turn headlines into investment advice",
        description: "Headlines must inform, not amplify profit expectations or fear of missing out.",
        tag: "Transparent",
      },
      {
        title: "Separate facts from interpretation",
        description: "Readers should know what happened and what is our read of the situation.",
        tag: "Clear",
      },
      {
        title: "Name risks when discussing opportunity",
        description: "Growth stories need context on volatility, liquidity and data limits.",
        tag: "Balanced",
      },
      {
        title: "Keep it concise without removing context",
        description: "Stories should be scannable while leaving enough signal for follow-up research.",
        tag: "Useful",
      },
    ],
    workflowHeading: "How a story is shaped",
    workflowLinkLabel: "Process",
    workflow: [
      {
        title: "Select the signal",
        description: "We filter topics from price action, flows, on-chain data, policy and repeated reader questions.",
      },
      {
        title: "Check the context",
        description: "We compare historical data, source events and the points that remain uncertain.",
      },
      {
        title: "Write for clarity",
        description: "We structure stories around the main point, why it matters and what to watch next.",
      },
    ],
    teamHeading: "Team & commitment",
    teamNotes: [
      {
        title: "Reader-first layout",
        description: "Every screen is built for fast scanning on both mobile and desktop, matching how markets are followed.",
      },
      {
        title: "No buy or sell signals",
        description: "CoinView provides information and analysis; investment decisions remain with readers.",
      },
      {
        title: "Disciplined expansion",
        description: "Mock content stays behind a typed adapter so a future API can replace it without changing the route.",
      },
    ],
    emptyTitle: "No about content yet",
    emptyDescription: "The about dataset is empty. Add typed mock content inside this feature folder.",
    errorTitle: "Could not load the about page",
    errorDescription: "Please try again later or check the reader/about adapter.",
  },
};

export const aboutCards = aboutPages["vi-vn"].pillars.map(({ title, description }) => ({ title, description }));
