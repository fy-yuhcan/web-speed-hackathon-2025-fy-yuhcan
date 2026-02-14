import { useEffect, useRef } from 'react';

export function useScrollSnap({ scrollPadding }: { scrollPadding: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isSnapping = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (container == null) {
      return;
    }

    let releaseTimer: ReturnType<typeof setTimeout> | null = null;
    let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
    const releaseSnapping = () => {
      if (releaseTimer != null) {
        clearTimeout(releaseTimer);
      }
      releaseTimer = setTimeout(() => {
        isSnapping.current = false;
      }, 250);
    };

    const snapToNearest = () => {
      const currentContainer = containerRef.current;
      if (currentContainer == null || isSnapping.current) {
        return;
      }
      const childElements = Array.from(currentContainer.children) as HTMLElement[];
      if (childElements.length === 0) {
        return;
      }
      const childScrollPositions = childElements.map((element) => element.offsetLeft);
      const scrollPosition = currentContainer.scrollLeft;
      const childIndex = childScrollPositions.reduce((prev, curr, index) => {
        return Math.abs(curr - scrollPosition) < Math.abs((childScrollPositions[prev] ?? 0) - scrollPosition)
          ? index
          : prev;
      }, 0);
      const destination = (childScrollPositions[childIndex] ?? 0) - scrollPadding;
      if (Math.abs(destination - scrollPosition) < 1) {
        return;
      }

      isSnapping.current = true;
      currentContainer.scrollTo({
        behavior: 'smooth',
        left: destination,
      });
      releaseSnapping();
    };

    const scheduleSnap = () => {
      if (scrollIdleTimer != null) {
        clearTimeout(scrollIdleTimer);
      }
      scrollIdleTimer = setTimeout(() => {
        snapToNearest();
      }, 120);
    };

    container.addEventListener('scroll', scheduleSnap, { passive: true });

    return () => {
      container.removeEventListener('scroll', scheduleSnap);
      if (scrollIdleTimer != null) {
        clearTimeout(scrollIdleTimer);
      }
      if (releaseTimer != null) {
        clearTimeout(releaseTimer);
      }
    };
  }, [scrollPadding]);

  return containerRef;
}
