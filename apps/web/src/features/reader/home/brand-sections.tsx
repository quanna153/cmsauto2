import { CoinTickerTape } from "@/components/reader/coin-ticker-tape";

import { CryptoSphere } from "./crypto-sphere";

function FluidBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 animate-[home_fluid_base_18s_ease-in-out_infinite] bg-[linear-gradient(115deg,#ffffff_0%,#f8f5eb_24%,#f5e7b3_48%,#ffffff_72%,#f4efe1_100%)] bg-[length:160%_160%]" />
      <div className="pointer-events-none absolute -left-[12%] top-[-12%] h-72 w-[48rem] animate-[home_fluid_blob_one_17s_ease-in-out_infinite] rounded-[42%] bg-[radial-gradient(circle_at_35%_45%,rgba(200,162,39,0.22),rgba(255,255,255,0.82)_52%,rgba(255,255,255,0)_78%)] blur-2xl" />
      <div className="pointer-events-none absolute right-[-16%] top-[4%] h-80 w-[52rem] animate-[home_fluid_blob_two_21s_ease-in-out_infinite] rounded-[45%] bg-[radial-gradient(circle_at_50%_45%,rgba(245,231,179,0.7),rgba(255,255,255,0.78)_48%,rgba(255,255,255,0)_76%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-24%] left-[18%] h-72 w-[54rem] animate-[home_fluid_blob_three_24s_ease-in-out_infinite] rounded-[48%] bg-[linear-gradient(105deg,rgba(255,255,255,0),rgba(200,162,39,0.16),rgba(255,255,255,0.74),rgba(245,231,179,0.24))] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.82),rgba(255,255,255,0)_46%)]" />
    </>
  );
}

export function HomeIntroSection({ locale = "vi-vn" }: { locale?: "vi-vn" | "en-us" }) {
  return (
    <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-[#F5F5F2] font-sans text-[#111827]">
      <FluidBackdrop />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.72))]" />
      <div className="relative mx-auto max-w-7xl px-5 py-10 md:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.72fr)]">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">CoinRadar Newsroom</p>
            <h1 className="mt-3 inline-block max-w-5xl text-[clamp(1.55rem,7vw,2.35rem)] font-bold uppercase leading-tight tracking-normal text-[#111827]">
              Điểm chạm thông tin crypto cho <span className="text-[#A88412]">nhà đầu tư Việt</span>
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#4B5563] md:text-base">
              Cập nhật nhịp chuyển động thị trường, củng cố kiến thức nền tảng và chọn lọc các góc phân tích đáng chú ý giúp bạn hiểu điều gì đứng sau mỗi biến động giá thay vì chỉ nhìn vào những con số thay đổi từng phút.
            </p>
          </div>
          <div className="relative mx-auto h-[19rem] w-full max-w-[34rem] overflow-visible sm:h-[22rem] lg:h-[24rem]">
            <CryptoSphere locale={locale} />
          </div>
        </div>
        <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden">
          <CoinTickerTape variant="hero" />
        </div>
      </div>
      <style>{`
        @keyframes home_fluid_base {
          0%, 100% { background-position: 0% 50%; filter: saturate(1); }
          45% { background-position: 82% 42%; filter: saturate(1.12); }
          72% { background-position: 48% 88%; filter: saturate(1.04); }
        }
        @keyframes home_fluid_blob_one {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-12deg) scale(1); opacity: 0.78; }
          50% { transform: translate3d(8%, 10%, 0) rotate(5deg) scale(1.12); opacity: 0.95; }
        }
        @keyframes home_fluid_blob_two {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(16deg) scale(1); opacity: 0.66; }
          50% { transform: translate3d(-9%, 8%, 0) rotate(2deg) scale(1.08); opacity: 0.92; }
        }
        @keyframes home_fluid_blob_three {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-8deg) scale(1); opacity: 0.55; }
          50% { transform: translate3d(6%, -12%, 0) rotate(7deg) scale(1.16); opacity: 0.82; }
        }
      `}</style>
    </section>
  );
}

export function HomeVisionSection() {
  return (
    <section className="relative overflow-hidden border-y border-[#E5E7EB] bg-white font-sans text-[#111827]" id="home-vision">
      <FluidBackdrop />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.72fr)] lg:py-12">
        <div className="self-center">
          <p className="text-3xl font-bold uppercase leading-none text-[#A88412] sm:text-4xl lg:text-[48px]">
            TẦM NHÌN - SỨ MỆNH
          </p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[#111827] md:text-base">
            <p>
              Chúng tôi xây dựng một không gian crypto dễ tiếp cận, nơi dữ liệu thị trường, tin tức cập nhật và kiến thức nền tảng được kết nối trong cùng một hệ quy chiếu. Từ đó, người đọc không chỉ theo dõi biến động giá, mà còn hiểu rõ hơn bối cảnh, dòng tiền và những yếu tố đang định hình thị trường.
            </p>
            <p>
              Trong dài hạn, CoinRadar hướng đến việc hình thành thói quen đầu tư có kỷ luật: biết quan sát thị trường, nhận diện rủi ro, đọc đúng tín hiệu và duy trì tư duy độc lập trước những chu kỳ biến động liên tục của tài sản số.
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            ["01", "Dữ liệu rõ ràng", "Theo dõi giá, dòng tiền và tin tức trong cùng một mạch đọc."],
            ["02", "Biên tập có chọn lọc", "Ưu tiên bối cảnh, nguồn tin và tín hiệu có ích cho quyết định."],
            ["03", "Trải nghiệm nhanh", "Reader nhẹ, dễ đọc, tối ưu cho mobile và desktop."]
          ].map(([index, title, text]) => (
            <article className="rounded-lg border border-[#E5E7EB] bg-white/88 p-4 shadow-[0_14px_34px_rgba(17,24,39,0.05)] backdrop-blur" key={index}>
              <p className="text-xs font-bold text-[#A88412]">{index}</p>
              <h3 className="mt-2 text-base font-bold text-[#111827]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeBrandSections() {
  return (
    <>
      <HomeIntroSection />
      <HomeVisionSection />
    </>
  );
}
