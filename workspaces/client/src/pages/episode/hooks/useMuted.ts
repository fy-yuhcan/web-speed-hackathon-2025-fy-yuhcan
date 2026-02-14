import { useStore } from '@wsh-2025/client/src/app/StoreContext';

export function useMuted() {
  const muted = useStore((s) => s.pages.episode.muted);
  const setMuted = useStore((s) => s.pages.episode.setMuted);

  const toggleMuted = () => {
    setMuted(!muted);
  };

  return [muted, toggleMuted] as const;
}
