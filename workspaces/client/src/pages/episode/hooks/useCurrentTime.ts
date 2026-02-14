import { useStore } from '@wsh-2025/client/src/app/StoreContext';

export function useCurrentTime() {
  const currentTime = useStore((s) => s.pages.episode.currentTime);
  const updateCurrentTime = useStore((s) => s.pages.episode.updateCurrentTime);

  const update = (second: number): void => {
    updateCurrentTime(second);
  };

  return [currentTime, update] as const;
}
