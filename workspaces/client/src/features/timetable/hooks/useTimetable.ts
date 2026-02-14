import { useMemo } from 'react';
import { ArrayValues } from 'type-fest';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';

type ChannelId = string;

export function useTimetable() {
  const channels = useStore((s) => s.features.channel.channels);
  const programs = useStore((s) => s.features.timetable.programs);

  return useMemo(() => {
    const programList = Object.values(programs);
    const record: Record<ChannelId, ArrayValues<typeof programList>[]> = Object.fromEntries(
      Object.keys(channels).map((channelId) => [channelId, []]),
    );

    for (const program of programList) {
      const list = record[program.channelId];
      if (list != null) {
        list.push(program);
      }
    }
    for (const list of Object.values(record)) {
      list.sort((a, b) => {
        return a.startAt.localeCompare(b.startAt);
      });
    }

    return record;
  }, [channels, programs]);
}
