import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  children: ReactNode;
  ratioHeight: number;
  ratioWidth: number;
}

export const AspectRatio = ({ children, ratioHeight, ratioWidth }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (container == null) {
      return;
    }

    const recalculate = () => {
      setWidth(container.getBoundingClientRect().width);
    };

    recalculate();
    const resizeObserver = new ResizeObserver(recalculate);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const height = (width * ratioHeight) / ratioWidth;

  return (
    <div ref={containerRef} className={`h-[${height}px] relative w-full`}>
      {children}
    </div>
  );
};
