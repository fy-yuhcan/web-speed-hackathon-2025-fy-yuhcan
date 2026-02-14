import { lens } from '@dhmk/zustand-lens';
import { StandardSchemaV1 } from '@standard-schema/spec';
import type * as schema from '@wsh-2025/schema/src/api/schema';
import { ArrayValues } from 'type-fest';

import { timetableService } from '@wsh-2025/client/src/features/timetable/services/timetableService';

type ProgramId = string;

interface TimetableState {
  programs: Record<ProgramId, ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>>;
}

interface TimetableActions {
  fetchTimetable: (params: {
    since: string;
    until: string;
  }) => Promise<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>;
}

export const createTimetableStoreSlice = () => {
  return lens<TimetableState & TimetableActions>((set) => ({
    fetchTimetable: async ({ since, until }) => {
      const programs = await timetableService.fetchTimetable({ since, until });
      const nextPrograms: TimetableState['programs'] = {};
      for (const program of programs) {
        nextPrograms[program.id] = program;
      }
      set(() => {
        return {
          programs: nextPrograms,
        };
      });
      return programs;
    },
    programs: {},
  }));
};
