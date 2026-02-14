import { StandardSchemaV1 } from '@standard-schema/spec';
import type * as schema from '@wsh-2025/schema/src/api/schema';
import { useCallback } from 'react';
import { ArrayValues } from 'type-fest';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';

type Program = ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>;

export function useSelectedProgramId() {
  const selectedProgramId = useStore((s) => s.pages.timetable.selectedProgramId);
  const selectProgram = useStore((s) => s.pages.timetable.selectProgram);
  const setProgram = useCallback(
    (program: Program | null) => {
      selectProgram(program);
    },
    [selectProgram],
  );

  return [selectedProgramId, setProgram] as const;
}
