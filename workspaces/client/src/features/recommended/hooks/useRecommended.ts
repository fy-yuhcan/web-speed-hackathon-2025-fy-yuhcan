import { shallow } from 'zustand/shallow';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';

interface Params {
  referenceId: string;
}

const EMPTY_MODULE_IDS: string[] = [];

export function useRecommended({ referenceId }: Params) {
  return useStore(
    (s) => {
      const moduleIds = s.features.recommended.references[referenceId] ?? EMPTY_MODULE_IDS;
      const recommendedModules = s.features.recommended.recommendedModules;
      return moduleIds
        .map((moduleId) => recommendedModules[moduleId])
        .filter(<T>(m: T): m is NonNullable<T> => m != null);
    },
    shallow,
  );
}
