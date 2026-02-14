import { createStore } from '@wsh-2025/client/src/app/createStore';

export const prefetch = async (_store: ReturnType<typeof createStore>) => {
  return null;
};

export const NotFoundPage = () => {
  return (
    <>
      <title>見つかりません - AremaTV</title>

      <div className="w-full px-[32px] py-[48px]">
        <section className="mb-[32px] flex w-full flex-col items-center justify-center gap-y-[20px]">
          <h1 className="text-[32px] font-bold text-[#ffffff]">ページが見つかりませんでした</h1>
          <p>あなたが見ようとしたページは、残念ながら見つけられませんでした。</p>
          <img
            alt=""
            className="h-auto w-[640px]"
            decoding="async"
            fetchPriority="high"
            height={270}
            loading="eager"
            src="/public/animations/001.webp"
            width={480}
          />
        </section>
      </div>
    </>
  );
};
