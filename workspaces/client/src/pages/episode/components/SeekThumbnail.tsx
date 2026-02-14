import { StandardSchemaV1 } from '@standard-schema/spec';
import type * as schema from '@wsh-2025/schema/src/api/schema';
import { useRef } from 'react';

import { useSubscribePointer } from '@wsh-2025/client/src/features/layout/hooks/useSubscribePointer';
import { usePointer } from '@wsh-2025/client/src/features/layout/hooks/usePointer';
import { useSeekThumbnail } from '@wsh-2025/client/src/pages/episode/hooks/useSeekThumbnail';

const SEEK_THUMBNAIL_WIDTH = 160;

interface Props {
  episode: StandardSchemaV1.InferOutput<typeof schema.getEpisodeByIdResponse>;
}

export const SeekThumbnail = ({ episode }: Props) => {
  useSubscribePointer();

  const ref = useRef<HTMLDivElement>(null);
  const seekThumbnail = useSeekThumbnail({ episode });
  const pointer = usePointer();

  const elementRect = ref.current?.parentElement?.getBoundingClientRect() ?? { left: 0, width: 0 };
  const relativeX = pointer.x - elementRect.left;

  // サムネイルが画面からはみ出ないようにサムネイル中央を基準として left を計算する
  const MIN_LEFT = SEEK_THUMBNAIL_WIDTH / 2;
  const MAX_LEFT = elementRect.width - SEEK_THUMBNAIL_WIDTH / 2;

  return (
    <div
      ref={ref}
      className={`absolute h-[90px] w-[160px] bg-[size:auto_100%] bg-[url(${seekThumbnail})] bottom-0 translate-x-[-50%]`}
      style={{
        backgroundPositionX: 0,
        left: Math.max(MIN_LEFT, Math.min(relativeX, MAX_LEFT)),
      }}
    />
  );
};
