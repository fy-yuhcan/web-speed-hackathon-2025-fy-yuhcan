import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { ReactElement } from 'react';
import { ArrayValues } from 'type-fest';

import { HEIGHT_ONE_HOUR } from '@wsh-2025/client/src/features/timetable/constants/grid_size';
import { Gutter } from '@wsh-2025/client/src/pages/timetable/components/Gutter';
import { Program } from '@wsh-2025/client/src/pages/timetable/components/Program';

interface Props {
  channelId: string;
  currentUnixtimeMs: number;
  programList: ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>[];
}

const RENDER_PAST_MS = 0;
const RENDER_FUTURE_MS = 30 * 60 * 1000;

export const ProgramList = ({ channelId, currentUnixtimeMs, programList }: Props): ReactElement => {
  return (
    <div className="relative">
      <div className="flex flex-col">
        {programList.map((program) => {
          const startAtMs = Date.parse(program.startAt);
          const endAtMs = Date.parse(program.endAt);
          const durationMs = Math.max(0, endAtMs - startAtMs);
          const height = HEIGHT_ONE_HOUR * (durationMs / (60 * 60 * 1000));
          const shouldRenderProgram =
            endAtMs >= currentUnixtimeMs - RENDER_PAST_MS && startAtMs <= currentUnixtimeMs + RENDER_FUTURE_MS;

          return (
            <div
              key={program.id}
              className="shrink-0 grow-0"
              style={{
                containIntrinsicSize: `${Math.max(1, Math.round(height))}px`,
                contentVisibility: 'auto',
                height,
              }}
            >
              {shouldRenderProgram ? (
                <Program currentUnixtimeMs={currentUnixtimeMs} height={height} program={program} />
              ) : (
                <div aria-hidden className="h-full w-full" />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute inset-y-0 right-[-4px] z-10 w-[8px]">
        <Gutter channelId={channelId} />
      </div>
    </div>
  );
};
