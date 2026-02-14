import { useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 276;
const GAP = 12;

// repeat(auto-fill, minmax(276px, 1fr)) を計算で求める
export function useCarouselItemWidth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(MIN_WIDTH);

  useEffect(() => {
    const container = containerRef.current;
    if (container == null) {
      return;
    }

    const recalculate = () => {
      const styles = window.getComputedStyle(container);
      const innerWidth =
        container.clientWidth - parseInt(styles.paddingLeft, 10) - parseInt(styles.paddingRight, 10);
      const safeInnerWidth = Math.max(innerWidth, MIN_WIDTH);
      const itemCount = Math.max(1, Math.floor((safeInnerWidth + GAP) / (MIN_WIDTH + GAP)));
      setItemWidth(Math.max(MIN_WIDTH, Math.floor((safeInnerWidth + GAP) / itemCount - GAP)));
    };

    recalculate();
    const resizeObserver = new ResizeObserver(recalculate);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { ref: containerRef, width: itemWidth };
}
