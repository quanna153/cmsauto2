import type { Locale } from "@cmsauto/contracts";

import type { ReaderArticle } from "@/features/reader/model";

type FallbackArticleSeed = {
  articleSection: ReaderArticle["articleSection"];
  excerpt: string;
  markdown: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  slug: string;
  title: string;
};

const viArticles: FallbackArticleSeed[] = [
  {
    articleSection: "markets",
    excerpt: "Bức tranh nhanh về giá Bitcoin, Ethereum, vốn hóa, thanh khoản và các tín hiệu cần theo dõi trong ngày.",
    markdown: `Thị trường crypto thay đổi liên tục, nên người đọc cần nhìn nhiều lớp dữ liệu thay vì chỉ nhìn giá tăng giảm trong vài phút.

## Bức tranh tổng quan

Bitcoin vẫn là trục chính của thị trường. Khi BTC giữ vùng hỗ trợ quan trọng, dòng tiền thường có thêm điều kiện để lan sang Ethereum và nhóm altcoin thanh khoản cao.

## Những chỉ số nên xem

Vốn hóa toàn thị trường cho biết quy mô dòng tiền. Khối lượng 24h phản ánh mức độ tham gia. BTC dominance giúp nhận biết dòng tiền đang ưu tiên Bitcoin hay đang mở rộng sang altcoin.

## Cách đọc dữ liệu trong ngày

Không nên ra quyết định chỉ vì một cây nến ngắn hạn. Hãy kết hợp giá, volume, vùng hỗ trợ, tin tức và lịch sự kiện trước khi xây dựng kịch bản.`,
    primaryKeyword: "Thị trường",
    secondaryKeywords: ["Bitcoin", "Ethereum", "Vốn hóa", "Altcoin"],
    slug: "thi-truong-crypto-hom-nay",
    title: "Thị trường crypto hôm nay: giá, vốn hóa và tín hiệu chính"
  },
  {
    articleSection: "knowledge",
    excerpt: "Tìm hiểu Bitcoin từ nền tảng blockchain, nguồn cung giới hạn đến cách người mới nên tiếp cận tài sản số này.",
    markdown: `Bitcoin là tài sản số phi tập trung đầu tiên, vận hành trên mạng lưới blockchain công khai. Thay vì phụ thuộc vào ngân hàng trung gian, Bitcoin dùng cơ chế đồng thuận để xác nhận giao dịch và bảo vệ lịch sử dữ liệu.

## Bitcoin hoạt động như thế nào?

Mỗi giao dịch được gom vào block, sau đó thợ đào xác thực và thêm vào chuỗi dữ liệu. Khi block đã được xác nhận đủ sâu, việc thay đổi lịch sử gần như không khả thi về mặt chi phí.

## Vì sao nguồn cung giới hạn quan trọng?

Bitcoin có nguồn cung tối đa 21 triệu BTC. Cơ chế halving làm tốc độ phát hành coin mới giảm dần theo thời gian, tạo nên tính khan hiếm có thể kiểm chứng.

## Người mới nên bắt đầu từ đâu?

Hãy hiểu ví cá nhân, private key, phí giao dịch và rủi ro biến động trước khi mua. Không nên đầu tư chỉ vì giá tăng nhanh hoặc vì tâm lý sợ bỏ lỡ cơ hội.`,
    primaryKeyword: "Bitcoin",
    secondaryKeywords: ["Blockchain", "Ví crypto", "Nguồn cung"],
    slug: "bitcoin-la-gi-huong-dan-chi-tiet-cho-nguoi-moi",
    title: "Bitcoin là gì? Hướng dẫn chi tiết cho người mới"
  },
  {
    articleSection: "knowledge",
    excerpt: "Giải thích hỗ trợ, kháng cự, xu hướng và cách dùng phân tích kỹ thuật một cách có kỷ luật.",
    markdown: `Phân tích kỹ thuật giúp nhà đầu tư đọc hành vi giá thông qua biểu đồ, khối lượng và các vùng phản ứng quan trọng. Đây không phải công cụ dự đoán chắc chắn, mà là cách xây dựng kịch bản giao dịch có xác suất.

## Hỗ trợ và kháng cự

Hỗ trợ là vùng giá nơi lực mua thường xuất hiện. Kháng cự là vùng giá nơi lực bán có thể tăng lên. Khi các vùng này bị phá vỡ rõ ràng, vai trò của chúng có thể đảo chiều.

## Xu hướng thị trường

Xu hướng tăng thường tạo đỉnh cao hơn và đáy cao hơn. Xu hướng giảm thường tạo đỉnh thấp hơn và đáy thấp hơn. Việc nhận diện xu hướng giúp tránh giao dịch ngược dòng quá sớm.

## Quản trị rủi ro

Một setup đẹp vẫn có thể thất bại. Luôn xác định điểm vô hiệu kịch bản, khối lượng vào lệnh và mức lỗ tối đa trước khi giao dịch.`,
    primaryKeyword: "Phân tích kỹ thuật",
    secondaryKeywords: ["Hỗ trợ", "Kháng cự", "Xu hướng"],
    slug: "phan-tich-ky-thuat-co-ban-ho-tro-khang-cu-va-xu-huong",
    title: "Phân tích kỹ thuật cơ bản: Hỗ trợ, kháng cự và xu hướng"
  },
  {
    articleSection: "knowledge",
    excerpt: "Tổng quan về DeFi, AMM, lending, stablecoin, yield farming và những rủi ro cần hiểu trước khi tham gia.",
    markdown: `DeFi là hệ sinh thái tài chính phi tập trung chạy trên blockchain. Người dùng có thể swap token, cho vay, vay, cung cấp thanh khoản hoặc tham gia các chiến lược tạo lợi suất mà không cần trung gian truyền thống.

## AMM và thanh khoản

AMM cho phép giao dịch thông qua pool thanh khoản. Người cung cấp thanh khoản nhận phí giao dịch nhưng cũng chịu rủi ro như impermanent loss và biến động giá tài sản.

## Lending và yield farming

Các giao thức lending cho phép gửi tài sản để nhận lãi hoặc vay bằng tài sản thế chấp. Yield farming thường kết hợp nhiều giao thức để tối ưu lợi suất, nhưng rủi ro smart contract và thanh khoản tăng theo độ phức tạp.

## Điều cần nhớ

Lợi suất cao luôn đi kèm rủi ro. Hãy kiểm tra audit, TVL, lịch sử vận hành, tokenomics và quyền kiểm soát hợp đồng trước khi gửi vốn.`,
    primaryKeyword: "DeFi",
    secondaryKeywords: ["AMM", "Lending", "TVL", "Yield", "Smart contract"],
    slug: "defi-la-gi-tim-hieu-he-sinh-thai-defi-tu-a-den-z",
    title: "DeFi là gì? Tìm hiểu hệ sinh thái DeFi từ A đến Z"
  },
  {
    articleSection: "analysis",
    excerpt: "Cách kết hợp dòng tiền sàn giao dịch, ví lớn và hoạt động mạng lưới với bối cảnh giá để đọc thị trường rõ hơn.",
    markdown: `Dữ liệu on-chain là các dấu vết giao dịch được ghi trực tiếp trên blockchain. Khi đọc đúng cách, dữ liệu này giúp quan sát dòng tiền, hành vi ví lớn và mức độ hoạt động của mạng lưới.

## Dòng tiền lên và xuống sàn

Token nạp lên sàn có thể cho thấy ý định bán, còn token rút khỏi sàn có thể phản ánh nhu cầu tự lưu ký. Tuy nhiên, một giao dịch đơn lẻ không đủ để kết luận xu hướng.

## Ví lớn và smart money

Theo dõi ví lớn giúp phát hiện các chuyển động đáng chú ý, nhưng không nên sao chép máy móc. Một ví có thể chuyển tài sản vì lý do bảo mật, OTC hoặc tái cân bằng nội bộ.

## Cách dùng hiệu quả

Kết hợp on-chain với giá, volume, funding rate và bối cảnh tin tức. Tín hiệu mạnh nhất thường đến từ sự đồng thuận của nhiều nguồn dữ liệu.`,
    primaryKeyword: "On-chain",
    secondaryKeywords: ["Dòng tiền", "Ví lớn", "Smart money"],
    slug: "on-chain-la-gi-cach-doc-du-lieu-on-chain-hieu-qua",
    title: "On-chain là gì? Cách đọc dữ liệu on-chain hiệu quả"
  },
  {
    articleSection: "analysis",
    excerpt: "Bảy nguyên tắc giúp nhà đầu tư crypto kiểm soát vị thế, cảm xúc và rủi ro trong thị trường biến động mạnh.",
    markdown: `Quản trị rủi ro là nền tảng sống còn trong crypto. Thị trường có thể tăng rất nhanh, nhưng cũng có thể đảo chiều mạnh trong thời gian ngắn.

## Không đặt toàn bộ vốn vào một kịch bản

Hãy phân bổ vốn theo nhiều mức rủi ro và luôn giữ phần tiền mặt dự phòng. Một danh mục tốt không chỉ tối đa hóa lợi nhuận, mà còn giúp bạn tồn tại qua chu kỳ xấu.

## Luôn biết điểm sai

Trước khi vào lệnh, hãy xác định điều kiện khiến nhận định ban đầu không còn đúng. Đây là cơ sở để cắt lỗ hoặc giảm vị thế mà không bị cảm xúc chi phối.

## Tránh giao dịch vì FOMO

Khi một tài sản đã tăng mạnh, rủi ro mua đuổi thường cao. Nếu bỏ lỡ một cơ hội, hãy chờ setup mới thay vì ép bản thân phải hành động ngay.`,
    primaryKeyword: "Quản trị rủi ro",
    secondaryKeywords: ["Danh mục", "FOMO", "Kỷ luật"],
    slug: "quan-tri-rui-ro-trong-crypto-7-nguyen-tac-vang",
    title: "Quản trị rủi ro trong crypto: 7 nguyên tắc vàng"
  }
];

const enArticles: FallbackArticleSeed[] = [
  {
    articleSection: "markets",
    excerpt: "A quick view of Bitcoin, Ethereum, market capitalization, liquidity and the signals worth watching today.",
    markdown: `Crypto markets move continuously, so readers need more than a short-term price change to understand what is happening.

## The market backdrop

Bitcoin remains the anchor asset. When BTC holds an important support area, liquidity often has more room to rotate toward Ethereum and large-cap altcoins.

## Signals to monitor

Total market capitalization shows the size of capital in the sector. Twenty-four hour volume reflects participation. BTC dominance helps identify whether capital prefers Bitcoin or is expanding toward altcoins.

## Reading the day correctly

Avoid building a thesis from a single candle. Combine price, volume, support areas, news and event calendars before defining a scenario.`,
    primaryKeyword: "Markets",
    secondaryKeywords: ["Bitcoin", "Ethereum", "Market cap", "Altcoins"],
    slug: "crypto-market-today-prices-market-cap-key-signals",
    title: "Crypto market today: prices, market cap and key signals"
  },
  {
    articleSection: "knowledge",
    excerpt: "Understand Bitcoin from blockchain foundations and fixed supply to the first steps every new reader should know.",
    markdown: `Bitcoin is the first decentralized digital asset operating on a public blockchain. Instead of relying on a bank or payment company, Bitcoin uses consensus to verify transactions and protect historical records.

## How Bitcoin works

Transactions are grouped into blocks and verified by miners before being added to the chain. Once a block has enough confirmations, changing that history becomes economically impractical.

## Why fixed supply matters

Bitcoin has a maximum supply of 21 million BTC. Halving events reduce new issuance over time, creating scarcity that anyone can verify.

## Where beginners should start

Learn personal wallets, private keys, network fees and volatility risk before buying. Do not invest only because price is moving quickly or because of fear of missing out.`,
    primaryKeyword: "Bitcoin",
    secondaryKeywords: ["Blockchain", "Wallets", "Fixed supply"],
    slug: "what-is-bitcoin-a-clear-guide-for-beginners",
    title: "What is Bitcoin? A clear guide for beginners"
  },
  {
    articleSection: "knowledge",
    excerpt: "A practical explanation of support, resistance, trends and disciplined use of technical analysis.",
    markdown: `Technical analysis helps investors read market behavior through charts, volume and important reaction zones. It is not a prediction machine; it is a way to build probabilistic trading scenarios.

## Support and resistance

Support is a price area where buying pressure often appears. Resistance is a price area where selling pressure may increase. Once these zones break clearly, their roles can reverse.

## Market trends

An uptrend usually creates higher highs and higher lows. A downtrend usually creates lower highs and lower lows. Identifying the trend helps avoid fighting the market too early.

## Risk discipline

Even a strong setup can fail. Define the invalidation point, position size and maximum loss before entering a trade.`,
    primaryKeyword: "Technical analysis",
    secondaryKeywords: ["Support", "Resistance", "Trend"],
    slug: "technical-analysis-basics-support-resistance-and-trends",
    title: "Technical analysis basics: support, resistance and trends"
  },
  {
    articleSection: "knowledge",
    excerpt: "An overview of DeFi, AMMs, lending, stablecoins, yield farming and the risks to understand first.",
    markdown: `DeFi is a decentralized financial ecosystem running on blockchains. Users can swap tokens, lend, borrow, provide liquidity or join yield strategies without a traditional intermediary.

## AMMs and liquidity

AMMs enable trading through liquidity pools. Liquidity providers earn fees but also face risks such as impermanent loss and asset volatility.

## Lending and yield farming

Lending protocols allow users to deposit assets for yield or borrow against collateral. Yield farming often combines several protocols to optimize returns, but smart contract and liquidity risk increase with complexity.

## What to remember

High yield always carries risk. Check audits, TVL, operating history, tokenomics and contract control before allocating capital.`,
    primaryKeyword: "DeFi",
    secondaryKeywords: ["AMM", "Lending", "TVL", "Yield", "Smart contract"],
    slug: "what-is-defi-a-practical-guide-to-decentralized-finance",
    title: "What is DeFi? A practical guide to decentralized finance"
  },
  {
    articleSection: "analysis",
    excerpt: "How to combine exchange flows, large wallets and network activity with price context for better market reading.",
    markdown: `On-chain data is the transaction footprint recorded directly on a blockchain. When used correctly, it helps readers observe capital flows, large-wallet behavior and network activity.

## Exchange inflows and outflows

Tokens moving to exchanges can imply selling intent, while withdrawals may reflect self-custody demand. Still, one transfer is not enough to define a trend.

## Large wallets and smart money

Tracking large wallets can reveal significant moves, but copying them blindly is risky. A wallet may transfer assets for security, OTC settlement or internal rebalancing.

## Using it effectively

Combine on-chain data with price, volume, funding rates and news context. The strongest signals usually come from agreement across several data sources.`,
    primaryKeyword: "On-chain",
    secondaryKeywords: ["Capital flows", "Large wallets", "Smart money"],
    slug: "what-on-chain-data-reveals-about-crypto-capital-flows",
    title: "What on-chain data reveals about crypto capital flows"
  },
  {
    articleSection: "analysis",
    excerpt: "Seven rules that help crypto investors control position size, emotion and risk in a volatile market.",
    markdown: `Risk management is the survival layer of crypto investing. The market can rise quickly, but it can also reverse sharply within a short period.

## Do not put all capital into one scenario

Allocate capital across different risk levels and keep reserve cash. A good portfolio does not only maximize returns; it helps you survive difficult cycles.

## Always know what invalidates the thesis

Before entering a position, define the condition that proves the original thesis wrong. This makes it easier to cut or reduce exposure without emotional hesitation.

## Avoid FOMO entries

After an asset has already moved sharply, chasing it often carries poor risk-reward. If you miss one opportunity, wait for another setup instead of forcing action.`,
    primaryKeyword: "Risk management",
    secondaryKeywords: ["Portfolio", "FOMO", "Discipline"],
    slug: "crypto-risk-management-seven-rules-for-volatile-markets",
    title: "Crypto risk management: seven rules for volatile markets"
  }
];

const articlesByLocale = {
  "vi-vn": viArticles,
  "en-us": enArticles
} satisfies Record<Locale, FallbackArticleSeed[]>;

export function getFallbackReaderArticles(locale: Locale): ReaderArticle[] {
  return articlesByLocale[locale].map((article, index) => ({
    articleId: `fallback-${locale}-${index + 1}`,
    articleSection: article.articleSection,
    authorBio: locale === "vi-vn" ? "Đội ngũ CoinRadar biên tập nội dung theo hướng dễ hiểu, thực tế và bám sát nhu cầu của nhà đầu tư." : "The CoinRadar editorial team curates practical, context-rich coverage for market readers.",
    authorName: "CoinRadar Research",
    authorTitle: locale === "vi-vn" ? "Bàn biên tập" : "Research Desk",
    excerpt: article.excerpt,
    id: `fallback-${locale}-${index + 1}`,
    language: locale === "vi-vn" ? "vi" : "en",
    livePath: `/${locale}/${article.slug}`,
    locale,
    markdown: article.markdown,
    metaDescription: article.excerpt,
    metaTitle: article.title,
    primaryKeyword: article.primaryKeyword,
    publishedAt: new Date(Date.UTC(2026, 5, 12 - index, 8, 0)).toISOString(),
    secondaryKeywords: article.secondaryKeywords,
    slug: article.slug,
    title: article.title
  }));
}
