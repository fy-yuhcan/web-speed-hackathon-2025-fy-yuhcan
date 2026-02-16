import { useMemo } from 'react';

import { SeriesEpisodeItem } from '@wsh-2025/client/src/features/series/components/SeriesEposideItem';

interface Props {
  episodes: {
    description: string;
    id: string;
    order: number;
    premium: boolean;
    thumbnailUrl: string;
    title: string;
  }[];
}

export const SeriesEpisodeList = ({ episodes }: Props) => {
  const orderedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => {
      return a.order - b.order;
    });
  }, [episodes]);
  const visibleEpisodes = orderedEpisodes.slice(0, 24);

  return (
    <div className="flex w-full flex-col gap-y-[16px]">
      {visibleEpisodes.map((episode) => (
        <div key={episode.id} className="shrink-0 grow-0">
          <SeriesEpisodeItem episode={episode} />
        </div>
      ))}
    </div>
  );
};
