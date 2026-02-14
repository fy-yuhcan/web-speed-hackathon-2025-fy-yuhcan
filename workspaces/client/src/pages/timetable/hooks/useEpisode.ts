import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { useEffect, useState } from 'react';

import { episodeService } from '@wsh-2025/client/src/features/episode/services/episodeService';

type Episode = StandardSchemaV1.InferOutput<typeof schema.getEpisodeByIdResponse>;

export function useEpisode(episodeId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const [episode, setEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEpisode(null);
      return;
    }

    let active = true;
    episodeService
      .fetchEpisodeById({ episodeId })
      .then((nextEpisode) => {
        if (!active) {
          return;
        }
        setEpisode(nextEpisode);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setEpisode(null);
      });
    return () => {
      active = false;
    };
  }, [enabled, episodeId]);

  return episode;
}
