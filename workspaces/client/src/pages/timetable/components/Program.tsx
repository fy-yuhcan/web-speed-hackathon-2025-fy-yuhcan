import { StandardSchemaV1 } from '@standard-schema/spec';
import type * as schema from '@wsh-2025/schema/src/api/schema';
import { ReactElement } from 'react';
import { ArrayValues } from 'type-fest';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';
import { useColumnWidth } from '@wsh-2025/client/src/pages/timetable/hooks/useColumnWidth';

interface Props {
  currentUnixtimeMs: number;
  height: number;
  program: ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>;
}

const IMAGE_VISIBLE_MIN_HEIGHT = 10000;

export const Program = ({ currentUnixtimeMs, height, program }: Props): ReactElement => {
  const width = useColumnWidth(program.channelId);
  const selectProgram = useStore((s) => s.pages.timetable.selectProgram);
  const startAtMs = Date.parse(program.startAt);
  const endAtMs = Date.parse(program.endAt);
  const startMinuteText = program.startAt.slice(14, 16);
  const isBroadcasting = startAtMs <= currentUnixtimeMs && currentUnixtimeMs < endAtMs;
  const isArchived = endAtMs <= currentUnixtimeMs;
  const shouldImageBeVisible = height >= IMAGE_VISIBLE_MIN_HEIGHT;
  const onClick = () => {
    selectProgram(program);
  };

  return (
    <button
      className={`w-auto cursor-pointer border-[1px] border-solid border-[#000000] px-[12px] py-[8px] text-left ${isArchived ? 'hover:brightness-200' : 'hover:brightness-125'}`}
      style={{
        backgroundColor: isBroadcasting ? '#FCF6E5' : '#212121',
        height,
        opacity: isArchived ? 0.5 : 1,
        width,
      }}
      type="button"
      onClick={onClick}
    >
      <div className="flex size-full flex-col overflow-hidden">
        <div className="mb-[8px] flex flex-row items-start justify-start">
          <span
            className={`mr-[8px] shrink-0 grow-0 text-[14px] font-bold ${isBroadcasting ? 'text-[#767676]' : 'text-[#999999]'}`}
          >
            {startMinuteText}
          </span>
          <div
            className={`grow-1 shrink-1 overflow-hidden text-[14px] font-bold ${isBroadcasting ? 'text-[#212121]' : 'text-[#ffffff]'}`}
          >
            <div className="line-clamp-3">{program.title}</div>
          </div>
        </div>
        {shouldImageBeVisible ? (
          <div className="w-full">
            <img
              alt=""
              className="pointer-events-none w-full rounded-[8px] border-[2px] border-solid border-[#FFFFFF1F]"
              decoding="async"
              height={720}
              loading="lazy"
              src={program.thumbnailUrl}
              width={1280}
            />
          </div>
        ) : null}
      </div>
    </button>
  );
};
