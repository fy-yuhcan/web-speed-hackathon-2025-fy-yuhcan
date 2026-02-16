import { lens } from '@dhmk/zustand-lens';
import { RefCallback } from 'react';

import { PlayerWrapper } from '@wsh-2025/client/src/features/player/interfaces/player_wrapper';

interface ProgramPageState {
  abortController: AbortController | null;
  muted: boolean;
  player: PlayerWrapper | null;
  playing: boolean;
}

interface ProgramPageActions {
  playerRef: RefCallback<PlayerWrapper | null>;
  setMuted: (muted: boolean) => void;
}

export const createProgramPageStoreSlice = () => {
  return lens<ProgramPageState & ProgramPageActions>((set, get) => ({
    abortController: null,
    muted: true,
    player: null,
    playerRef: (player: PlayerWrapper | null) => {
      function onMount(player: PlayerWrapper): void {
        const abortController = new AbortController();

        player.videoElement.addEventListener(
          'playing',
          () => {
            set({ playing: true });
          },
          { signal: abortController.signal },
        );
        player.videoElement.addEventListener(
          'pause',
          () => {
            set({ playing: false });
          },
          { signal: abortController.signal },
        );

        set(() => ({
          abortController,
          muted: true,
          player,
          playing: false,
        }));
      }

      function onUnmount(): void {
        const { abortController } = get();
        abortController?.abort();

        set(() => ({
          abortController: null,
          player: null,
          playing: false,
        }));
      }

      if (player != null) {
        onMount(player);
      } else {
        onUnmount();
      }
    },
    setMuted: (muted: boolean) => {
      const { player } = get();
      player?.setMuted(muted);
      set(() => ({ muted }));
    },
    playing: false,
  }));
};
