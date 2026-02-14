import { useStore } from '@wsh-2025/client/src/app/StoreContext';

export function usePlaying() {
  const pause = useStore((s) => s.pages.episode.pause);
  const play = useStore((s) => s.pages.episode.play);
  const playing = useStore((s) => s.pages.episode.playing);

  const toggle = (): void => {
    if (playing) {
      pause();
    } else {
      play();
    }
  };

  return [playing, toggle] as const;
}
