import { DateTime } from 'luxon';
import { lazy, Suspense, useEffect } from 'react';
import Ellipsis from 'react-ellipsis-component';
import { Flipped } from 'react-flip-toolkit';
import { Link, Params, useNavigate, useParams } from 'react-router';
import invariant from 'tiny-invariant';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';
import { createStore } from '@wsh-2025/client/src/app/createStore';
import { AspectRatio } from '@wsh-2025/client/src/features/layout/components/AspectRatio';
import { useForceUpdate } from '@wsh-2025/client/src/features/layout/hooks/useForceUpdate';
import { PlayerType } from '@wsh-2025/client/src/features/player/constants/player_type';
import { useProgramById } from '@wsh-2025/client/src/features/program/hooks/useProgramById';
import { RecommendedSection } from '@wsh-2025/client/src/features/recommended/components/RecommendedSection';
import { useRecommended } from '@wsh-2025/client/src/features/recommended/hooks/useRecommended';
import { SeriesEpisodeList } from '@wsh-2025/client/src/features/series/components/SeriesEpisodeList';
import { useTimetable } from '@wsh-2025/client/src/features/timetable/hooks/useTimetable';
import { PlayerController } from '@wsh-2025/client/src/pages/program/components/PlayerController';
import { usePlayerRef } from '@wsh-2025/client/src/pages/program/hooks/usePlayerRef';

const LazyPlayer = lazy(async () => {
  void import('@wsh-2025/client/src/features/player/logics/create_player').then(({ preloadPlayerLibrary }) => {
    preloadPlayerLibrary(PlayerType.HlsJS);
  });
  const mod = await import('@wsh-2025/client/src/features/player/components/Player');
  return { default: mod.Player };
});

export const prefetch = async (store: ReturnType<typeof createStore>, { programId }: Params) => {
  invariant(programId);
  await Promise.all([
    store.getState().features.program.fetchProgramById({ programId }),
    store.getState().features.recommended.fetchRecommendedModulesByReferenceId({ referenceId: programId }),
  ]);
  return null;
};

export const ProgramPage = () => {
  const { programId } = useParams();
  invariant(programId);

  const program = useProgramById({ programId });
  invariant(program);

  const timetable = useTimetable();
  const programEndAtMs = DateTime.fromISO(program.endAt).toMillis();
  const nextProgram = timetable[program.channel.id]?.find((p) => {
    return programEndAtMs === DateTime.fromISO(p.startAt).toMillis();
  });

  const modules = useRecommended({ referenceId: programId });

  const playerRef = usePlayerRef();
  const playing = useStore((s) => s.pages.program.playing);

  const forceUpdate = useForceUpdate();
  const navigate = useNavigate();
  const nowMs = Date.now();
  const programStartAtMs = DateTime.fromISO(program.startAt).toMillis();
  const isArchived = programEndAtMs <= nowMs;
  const isBroadcastStarted = programStartAtMs <= nowMs;

  useEffect(() => {
    if (isArchived) {
      return;
    }

    if (!isBroadcastStarted) {
      const timeout = setTimeout(() => {
        forceUpdate();
      }, Math.max(programStartAtMs - Date.now(), 0));

      return () => {
        clearTimeout(timeout);
      };
    }

    const timeout = setTimeout(() => {
      if (nextProgram?.id) {
        void navigate(`/programs/${nextProgram.id}`, {
          preventScrollReset: true,
          replace: true,
          state: { loading: 'none' },
        });
      } else {
        forceUpdate();
      }
    }, Math.max(programEndAtMs - Date.now(), 0));

    return () => {
      clearTimeout(timeout);
    };
  }, [forceUpdate, isArchived, isBroadcastStarted, navigate, nextProgram?.id, programEndAtMs, programStartAtMs]);

  return (
    <>
      <title>{`${program.title} - ${program.episode.series.title} - AremaTV`}</title>

      <div className="px-[24px] py-[48px]">
        <Flipped stagger flipId={`program-${program.id}`}>
          <div className="m-auto mb-[16px] max-w-[1280px] outline outline-[1px] outline-[#212121]">
            <AspectRatio ratioHeight={9} ratioWidth={16}>
              {isArchived ? (
                <div className="relative size-full">
                  <img
                    alt=""
                    className="size-full object-cover"
                    decoding="async"
                    fetchPriority="high"
                    height={720}
                    loading="eager"
                    src={program.thumbnailUrl}
                    width={1280}
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#00000077] p-[24px]">
                    <p className="mb-[32px] text-[24px] font-bold text-[#ffffff]">この番組は放送が終了しました</p>
                    <Link
                      className="block flex w-[160px] flex-row items-center justify-center rounded-[4px] bg-[#1c43d1] p-[12px] text-[14px] font-bold text-[#ffffff] disabled:opacity-50"
                      to={`/episodes/${program.episode.id}`}
                    >
                      見逃し視聴する
                    </Link>
                  </div>
                </div>
              ) : isBroadcastStarted ? (
                <div className="relative size-full overflow-hidden bg-[#000000]">
                  <Suspense fallback={null}>
                    <LazyPlayer
                      className="size-full"
                      playerRef={playerRef}
                      playerType={PlayerType.HlsJS}
                      playlistUrl={`/streams/channel/${program.channel.id}/playlist.m3u8`}
                    />
                  </Suspense>
                  <img
                    alt=""
                    className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                      playing ? 'pointer-events-none opacity-0' : 'opacity-100'
                    }`}
                    decoding="async"
                    fetchPriority="high"
                    height={720}
                    loading="eager"
                    src={program.thumbnailUrl}
                    width={1280}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10">
                    <PlayerController />
                  </div>
                </div>
              ) : (
                <div className="relative size-full">
                  <img
                    alt=""
                    className="size-full object-cover"
                    decoding="async"
                    fetchPriority="high"
                    height={720}
                    loading="eager"
                    src={program.thumbnailUrl}
                    width={1280}
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#00000077] p-[24px]">
                    <p className="mb-[32px] text-[24px] font-bold text-[#ffffff]">
                      この番組は {DateTime.fromISO(program.startAt).toFormat('L月d日 H:mm')} に放送予定です
                    </p>
                  </div>
                </div>
              )}
            </AspectRatio>
          </div>
        </Flipped>

        <div className="mb-[24px]">
          <div className="text-[16px] text-[#ffffff]">
            <Ellipsis ellipsis maxLine={1} text={program.episode.series.title} visibleLine={1} />
          </div>
          <h1 className="mt-[8px] text-[22px] font-bold text-[#ffffff]">
            <Ellipsis ellipsis maxLine={2} text={program.title} visibleLine={2} />
          </h1>
          <div className="mt-[8px] text-[16px] text-[#999999]">
            {DateTime.fromISO(program.startAt).toFormat('L月d日 H:mm')}
            {' 〜 '}
            {DateTime.fromISO(program.endAt).toFormat('L月d日 H:mm')}
          </div>
          <div className="mt-[16px] text-[16px] text-[#999999]">
            <Ellipsis ellipsis maxLine={3} text={program.description} visibleLine={3} />
          </div>
        </div>

        <div className="mt-[24px] min-h-[320px]">
          {modules[0] != null ? <RecommendedSection module={modules[0]} /> : <div className="h-[320px] w-full rounded-[8px] bg-[#171717]" />}
        </div>

        <div className="mt-[24px]">
          <h2 className="mb-[12px] text-[22px] font-bold text-[#ffffff]">関連するエピソード</h2>
          <SeriesEpisodeList episodes={program.episode.series.episodes} />
        </div>
      </div>
    </>
  );
};
