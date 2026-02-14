import { useEffect } from 'react';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';

export function useSubscribePointer(): void {
  const updatePointer = useStore((s) => s.features.layout.updatePointer);

  useEffect(() => {
    const abortController = new AbortController();
    const handlePointerMove = (ev: PointerEvent) => {
      updatePointer({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true, signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [updatePointer]);
}
