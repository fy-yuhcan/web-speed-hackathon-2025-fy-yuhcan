import { DateTime } from 'luxon';
import invariant from 'tiny-invariant';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';
import { createStore } from '@wsh-2025/client/src/app/createStore';
import { DEFAULT_WIDTH, HEIGHT_ONE_HOUR } from '@wsh-2025/client/src/features/timetable/constants/grid_size';
import { useTimetable } from '@wsh-2025/client/src/features/timetable/hooks/useTimetable';
import { ChannelTitle } from '@wsh-2025/client/src/pages/timetable/components/ChannelTitle';
import { NewTimetableFeatureDialog } from '@wsh-2025/client/src/pages/timetable/components/NewTimetableFeatureDialog';
import { ProgramDetailDialog } from '@wsh-2025/client/src/pages/timetable/components/ProgramDetailDialog';
import { ProgramList } from '@wsh-2025/client/src/pages/timetable/components/ProgramList';
import { TimelineYAxis } from '@wsh-2025/client/src/pages/timetable/components/TimelineYAxis';
import { useCurrentUnixtimeMs } from '@wsh-2025/client/src/pages/timetable/hooks/useCurrentUnixtimeMs';
import { useSelectedProgramId } from '@wsh-2025/client/src/pages/timetable/hooks/useSelectedProgramId';
import { useShownNewFeatureDialog } from '@wsh-2025/client/src/pages/timetable/hooks/useShownNewFeatureDialog';

export const prefetch = async (store: ReturnType<typeof createStore>) => {
  const now = DateTime.now();
  const since = now.startOf('day').toISO();
  const until = now.endOf('day').toISO();

  await store.getState().features.channel.fetchChannels();
  await store.getState().features.timetable.fetchTimetable({ since, until });
  return null;
};

export const TimetablePage = () => {
  const record = useTimetable();
  const shownNewFeatureDialog = useShownNewFeatureDialog();
  const currentUnixtimeMs = useCurrentUnixtimeMs();
  const programs = useStore((s) => s.features.timetable.programs);
  const [selectedProgramId] = useSelectedProgramId();

  const channelIds = Object.keys(record);
  const programLists = Object.values(record);
  const selectedProgram = selectedProgramId != null ? (programs[selectedProgramId] ?? null) : null;

  return (
    <>
      <title>番組表 - AremaTV</title>

      <div
        className="relative grid size-full overflow-x-auto overflow-y-auto [grid-template-areas:'channel_channel''hours_content'] [grid-template-columns:min-content_1fr] [grid-template-rows:min-content_1fr]"
        style={{
          display: 'grid',
          gridTemplateAreas: "'channel channel' 'hours content'",
          gridTemplateColumns: 'min-content 1fr',
          gridTemplateRows: 'min-content 1fr',
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <h1 className="absolute left-[24px] top-[12px] z-30 text-[18px] font-bold text-[#ffffff]">番組表</h1>
        <div className="sticky top-0 z-20 flex w-fit flex-row bg-[#000000] pl-[24px] [grid-area:channel]">
          {channelIds.map((channelId) => (
            <div key={channelId} className="shrink-0 grow-0">
              <ChannelTitle channelId={channelId} />
            </div>
          ))}
        </div>

        <div
          className="sticky inset-y-0 left-0 z-10 shrink-0 grow-0 bg-[#000000] [grid-area:hours]"
          style={{ bottom: 0, left: 0, position: 'sticky', top: 0, width: 24 }}
        >
          <TimelineYAxis />
        </div>
        <div className="flex flex-row [grid-area:content]">
          {programLists.map((programList, index) => {
            const channelId = channelIds[index];
            invariant(channelId);
            return (
              <div
                key={channelIds[index]}
                className="shrink-0 grow-0"
                style={{
                  containIntrinsicSize: `${DEFAULT_WIDTH}px ${HEIGHT_ONE_HOUR * 24}px`,
                  contentVisibility: 'auto',
                }}
              >
                <ProgramList channelId={channelId} currentUnixtimeMs={currentUnixtimeMs} programList={programList} />
              </div>
            );
          })}
        </div>
      </div>

      <NewTimetableFeatureDialog isOpen={shownNewFeatureDialog} />
      <ProgramDetailDialog isOpen={selectedProgram != null} program={selectedProgram} />
    </>
  );
};
