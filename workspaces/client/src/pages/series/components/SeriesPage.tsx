import { Params, useParams } from 'react-router';
import invariant from 'tiny-invariant';

import { createStore } from '@wsh-2025/client/src/app/createStore';
import { RecommendedSection } from '@wsh-2025/client/src/features/recommended/components/RecommendedSection';
import { useRecommended } from '@wsh-2025/client/src/features/recommended/hooks/useRecommended';
import { SeriesEpisodeList } from '@wsh-2025/client/src/features/series/components/SeriesEpisodeList';
import { useSeriesById } from '@wsh-2025/client/src/features/series/hooks/useSeriesById';

export const prefetch = async (store: ReturnType<typeof createStore>, { seriesId }: Params) => {
  invariant(seriesId);
  await Promise.all([
    store.getState().features.series.fetchSeriesById({ seriesId }),
    store.getState().features.recommended.fetchRecommendedModulesByReferenceId({ referenceId: seriesId }),
  ]);
  return null;
};

export const SeriesPage = () => {
  const { seriesId } = useParams();
  invariant(seriesId);

  const series = useSeriesById({ seriesId });
  invariant(series);

  const modules = useRecommended({ referenceId: seriesId });

  return (
    <>
      <title>{`${series.title} - AremaTV`}</title>

      <div className="m-auto px-[24px] py-[48px]">
        <header className="mb-[24px] flex w-full flex-row items-start justify-between gap-[24px]">
          <img
            alt=""
            className="h-[225px] w-[400px] shrink-0 grow-0 rounded-[8px] border-[2px] border-solid border-[#FFFFFF1F] object-cover"
            decoding="async"
            fetchPriority="high"
            height={720}
            loading="eager"
            src={series.thumbnailUrl}
            width={1280}
          />
          <div className="grow-1 shrink-1 overflow-hidden">
            <h1
              className="mb-[16px] text-[32px] font-bold text-[#ffffff]"
              style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, display: '-webkit-box', overflow: 'hidden' }}
            >
              {series.title}
            </h1>
            <div className="text-[14px] text-[#999999]">
              <p
                style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, display: '-webkit-box', overflow: 'hidden' }}
              >
                {series.description}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-[24px]">
          <h2 className="mb-[12px] text-[22px] font-bold text-[#ffffff]">エピソード</h2>
          <SeriesEpisodeList episodes={series.episodes} />
        </div>

        <div className="min-h-[320px]">
          {modules[0] != null ? <RecommendedSection module={modules[0]} /> : <div className="h-[320px] w-full rounded-[8px] bg-[#171717]" />}
        </div>
      </div>
    </>
  );
};
