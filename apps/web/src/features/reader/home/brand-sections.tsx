import { CoinTickerTape } from "@/components/reader/coin-ticker-tape";

import { CryptoSphere } from "./crypto-sphere";

function FluidBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 animate-[home_fluid_base_18s_ease-in-out_infinite] bg-[linear-gradient(115deg,#ffffff_0%,#effdf5_24%,#dcfce7_48%,#ffffff_72%,#e8fff1_100%)] bg-[length:160%_160%]" />
      <div className="pointer-events-none absolute -left-[12%] top-[-12%] h-72 w-[48rem] animate-[home_fluid_blob_one_17s_ease-in-out_infinite] rounded-[42%] bg-[radial-gradient(circle_at_35%_45%,rgba(34,197,94,0.22),rgba(255,255,255,0.82)_52%,rgba(255,255,255,0)_78%)] blur-2xl" />
      <div className="pointer-events-none absolute right-[-16%] top-[4%] h-80 w-[52rem] animate-[home_fluid_blob_two_21s_ease-in-out_infinite] rounded-[45%] bg-[radial-gradient(circle_at_50%_45%,rgba(187,247,208,0.64),rgba(255,255,255,0.78)_48%,rgba(255,255,255,0)_76%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-24%] left-[18%] h-72 w-[54rem] animate-[home_fluid_blob_three_24s_ease-in-out_infinite] rounded-[48%] bg-[linear-gradient(105deg,rgba(255,255,255,0),rgba(34,197,94,0.14),rgba(255,255,255,0.74),rgba(187,247,208,0.2))] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.82),rgba(255,255,255,0)_46%)]" />
    </>
  );
}

export function HomeIntroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[#d7e7dc] bg-[#f0fbf4] font-sans text-[#07110c]">
      <FluidBackdrop />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.72))]" />
      <div className="relative mx-auto max-w-7xl px-5 py-11 md:py-14">
        <div className="mx-auto max-w-none text-center">
          <h1 className="inline-block whitespace-nowrap text-center text-[clamp(1rem,3vw,2.25rem)] font-bold uppercase leading-tight tracking-normal text-[#07110c]">
            Điểm chạm thông tin crypto cho <span className="text-[#009f4d]">nhà đầu tư Việt</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#425048] md:text-base">
            Cập nhật nhịp chuyển động thị trường, củng cố kiến thức nền tảng và chọn lọc các góc phân tích đáng chú ý giúp bạn hiểu điều gì đứng sau mỗi biến động giá thay vì chỉ nhìn vào những con số thay đổi từng phút.
          </p>
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
    <section className="relative overflow-hidden border-y border-[#d7e7dc] bg-white font-sans text-[#07110c]" id="home-vision">
      <FluidBackdrop />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(22rem,0.9fr)] lg:py-12">
        <div className="self-center">
          <p className="text-3xl font-bold uppercase leading-none text-[#009f4d] sm:text-4xl lg:text-[48px]">
            TẦM NHÌN - SỨ MỆNH
          </p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[#07110c] md:text-base">
            <p>
              Chúng tôi xây dựng một không gian crypto dễ tiếp cận, nơi dữ liệu thị trường, tin tức cập nhật và kiến thức nền tảng được kết nối trong cùng một hệ quy chiếu. Từ đó, người đọc không chỉ theo dõi biến động giá, mà còn hiểu rõ hơn bối cảnh, dòng tiền và những yếu tố đang định hình thị trường.
            </p>
            <p>
              Trong dài hạn, CoinRadar hướng đến việc hình thành thói quen đầu tư có kỷ luật: biết quan sát thị trường, nhận diện rủi ro, đọc đúng tín hiệu và duy trì tư duy độc lập trước những chu kỳ biến động liên tục của tài sản số.
            </p>
          </div>
        </div>
        <div className="relative h-[22rem] overflow-visible sm:h-[24rem] lg:h-[27rem]">
          <CryptoSphere />
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
