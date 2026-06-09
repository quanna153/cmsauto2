import type { Locale } from "@cmsauto/contracts";
import type { KnowledgePageContent } from "./model";

export const knowledgePages: Record<Locale, KnowledgePageContent> = {
  "vi-vn": {
    eyebrow: "Kiến thức",
    heroBadge: "LEARN HUB",
    title: "Kiến thức",
    lead:
      "Một trung tâm học tập giúp người đọc đi từ nền tảng crypto, cách đọc thị trường đến quản trị rủi ro bằng ngôn ngữ dễ hiểu.",
    summary:
      "Nội dung được tổ chức thành taxonomy rõ ràng để người mới không bị ngợp, còn người đọc đã có kinh nghiệm có thể đi thẳng vào chủ đề cần tra cứu.",
    meta: ["Cho người mới", "Glossary ngắn", "Lộ trình thực hành"],
    taxonomyHeading: "Taxonomy học tập",
    taxonomyDescription:
      "Các nhóm chủ đề được thiết kế như cổng vào nhanh, tương tự cách trang thị trường gom tín hiệu để người đọc scan trong vài giây.",
    taxonomy: [
      {
        label: "Nền tảng",
        title: "Blockchain & ví",
        description: "Hiểu cách mạng lưới, ví cá nhân, seed phrase và giao dịch cơ bản hoạt động.",
        count: "12 bài",
        tone: "blue",
      },
      {
        label: "Đầu tư",
        title: "Rủi ro & phân bổ",
        description: "Các nguyên tắc quản trị vốn, biến động và cách tránh quyết định theo cảm xúc.",
        count: "9 bài",
        tone: "green",
      },
      {
        label: "DeFi",
        title: "Yield, lending, staking",
        description: "Giải thích lợi suất, thanh khoản, smart contract và những rủi ro thường bị bỏ qua.",
        count: "8 bài",
        tone: "amber",
      },
      {
        label: "On-chain",
        title: "Đọc dữ liệu ví & dòng tiền",
        description: "Theo dõi dòng tiền, sàn giao dịch, holder lớn và tín hiệu không nên diễn giải quá mức.",
        count: "7 bài",
        tone: "violet",
      },
    ],
    lessonsHeading: "Bài học nên đọc",
    lessonsLinkLabel: "Xem thêm",
    lessons: [
      {
        title: "Bitcoin là gì và vì sao nguồn cung giới hạn quan trọng?",
        description: "Bài nhập môn về mạng lưới Bitcoin, lịch halving và ý nghĩa của tính khan hiếm.",
        level: "Cơ bản",
        duration: "6 phút",
        tag: "BTC",
      },
      {
        title: "Cách bảo vệ ví cá nhân trước phishing",
        description: "Checklist thực tế để nhận diện link giả, token lạ và yêu cầu ký giao dịch nguy hiểm.",
        level: "Thực hành",
        duration: "8 phút",
        tag: "Security",
      },
      {
        title: "Funding rate nói gì về đòn bẩy thị trường?",
        description: "Giải thích cách funding phản ánh vị thế phái sinh và vì sao số dương không luôn là tín hiệu tốt.",
        level: "Trung cấp",
        duration: "7 phút",
        tag: "Derivatives",
      },
      {
        title: "Stablecoin khác gì tiền mặt trong tài khoản?",
        description: "So sánh cơ chế neo giá, tài sản bảo chứng và rủi ro khi dùng stablecoin trong DeFi.",
        level: "Cơ bản",
        duration: "5 phút",
        tag: "Stablecoin",
      },
    ],
    pathHeading: "Lộ trình gợi ý",
    pathLinkLabel: "Bắt đầu",
    path: [
      {
        marker: "01",
        title: "Nắm khái niệm cốt lõi",
        description: "Bắt đầu với blockchain, ví, private key, gas fee và giao dịch on-chain.",
      },
      {
        marker: "02",
        title: "Đọc thị trường có kỷ luật",
        description: "Học cách nhìn giá, volume, dominance và tin tức mà không phản ứng vội.",
      },
      {
        marker: "03",
        title: "Thực hành bảo mật",
        description: "Tạo thói quen kiểm tra URL, quyền ví, seed phrase và thiết bị lưu trữ.",
      },
    ],
    glossaryHeading: "Thuật ngữ nhanh",
    glossaryLinkLabel: "Glossary",
    glossary: [
      { term: "Gas fee", definition: "Phí trả cho mạng lưới khi thực hiện giao dịch hoặc tương tác smart contract." },
      { term: "TVL", definition: "Tổng giá trị tài sản đang được khóa trong một giao thức DeFi." },
      { term: "Slippage", definition: "Mức chênh lệch giữa giá kỳ vọng và giá khớp lệnh thực tế." },
      { term: "Airdrop", definition: "Cách dự án phân phối token cho nhóm người dùng đủ điều kiện." },
    ],
    metricsHeading: "Cấu trúc học",
    metrics: [
      { label: "Chủ đề", value: "4", detail: "Nền tảng, đầu tư, DeFi và on-chain" },
      { label: "Độ khó", value: "3", detail: "Cơ bản, thực hành và trung cấp" },
      { label: "Mục tiêu", value: "1", detail: "Giúp người đọc hiểu trước khi hành động" },
    ],
    emptyTitle: "Chưa có nội dung kiến thức",
    emptyDescription: "Dữ liệu knowledge đang trống. Hãy bổ sung typed mock trong feature folder này.",
    errorTitle: "Không tải được trang kiến thức",
    errorDescription: "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/knowledge.",
  },
  "en-us": {
    eyebrow: "Knowledge",
    heroBadge: "LEARN HUB",
    title: "Knowledge",
    lead:
      "A learning hub that helps readers move from crypto basics to market reading and risk management in plain language.",
    summary:
      "Content is organized into a clear taxonomy so new readers avoid overwhelm while experienced readers can jump straight to the topic they need.",
    meta: ["Beginner-friendly", "Short glossary", "Practical paths"],
    taxonomyHeading: "Learning taxonomy",
    taxonomyDescription:
      "Topic groups work as quick entry points, similar to how the markets page gathers signals for fast scanning.",
    taxonomy: [
      {
        label: "Basics",
        title: "Blockchain & wallets",
        description: "Understand networks, self-custody wallets, seed phrases and basic transactions.",
        count: "12 lessons",
        tone: "blue",
      },
      {
        label: "Investing",
        title: "Risk & allocation",
        description: "Capital management, volatility and ways to avoid emotional decision-making.",
        count: "9 lessons",
        tone: "green",
      },
      {
        label: "DeFi",
        title: "Yield, lending, staking",
        description: "Explain yield, liquidity, smart contracts and risks that are often overlooked.",
        count: "8 lessons",
        tone: "amber",
      },
      {
        label: "On-chain",
        title: "Wallets & flows",
        description: "Track flows, exchanges, large holders and signals that should not be overread.",
        count: "7 lessons",
        tone: "violet",
      },
    ],
    lessonsHeading: "Recommended lessons",
    lessonsLinkLabel: "More",
    lessons: [
      {
        title: "What is Bitcoin and why does limited supply matter?",
        description: "An introduction to the Bitcoin network, halvings and the meaning of scarcity.",
        level: "Basic",
        duration: "6 min",
        tag: "BTC",
      },
      {
        title: "Protecting your wallet from phishing",
        description: "A practical checklist for fake links, strange tokens and dangerous signature requests.",
        level: "Practical",
        duration: "8 min",
        tag: "Security",
      },
      {
        title: "What funding rates say about market leverage",
        description: "How funding reflects derivatives positioning and why positive funding is not always bullish.",
        level: "Intermediate",
        duration: "7 min",
        tag: "Derivatives",
      },
      {
        title: "How stablecoins differ from cash balances",
        description: "Peg mechanisms, reserve assets and risks when stablecoins are used in DeFi.",
        level: "Basic",
        duration: "5 min",
        tag: "Stablecoin",
      },
    ],
    pathHeading: "Suggested path",
    pathLinkLabel: "Start",
    path: [
      {
        marker: "01",
        title: "Learn core concepts",
        description: "Start with blockchain, wallets, private keys, gas fees and on-chain transactions.",
      },
      {
        marker: "02",
        title: "Read markets with discipline",
        description: "Look at price, volume, dominance and news without reacting too quickly.",
      },
      {
        marker: "03",
        title: "Practice security",
        description: "Build habits around URLs, wallet permissions, seed phrases and storage devices.",
      },
    ],
    glossaryHeading: "Quick terms",
    glossaryLinkLabel: "Glossary",
    glossary: [
      { term: "Gas fee", definition: "The network fee paid to submit a transaction or interact with a smart contract." },
      { term: "TVL", definition: "Total value locked inside a DeFi protocol." },
      { term: "Slippage", definition: "The gap between expected price and the final execution price." },
      { term: "Airdrop", definition: "A token distribution to users who meet project-defined criteria." },
    ],
    metricsHeading: "Learning structure",
    metrics: [
      { label: "Topics", value: "4", detail: "Basics, investing, DeFi and on-chain" },
      { label: "Levels", value: "3", detail: "Basic, practical and intermediate" },
      { label: "Goal", value: "1", detail: "Help readers understand before they act" },
    ],
    emptyTitle: "No knowledge content yet",
    emptyDescription: "The knowledge dataset is empty. Add typed mock content inside this feature folder.",
    errorTitle: "Could not load knowledge",
    errorDescription: "Please try again later or check the reader/knowledge adapter.",
  },
};

export const knowledgeCards = knowledgePages["vi-vn"].taxonomy.map(({ title, description }) => ({ title, description }));
