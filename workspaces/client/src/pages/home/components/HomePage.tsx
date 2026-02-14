import { createStore } from '@wsh-2025/client/src/app/createStore';
import { RecommendedSection } from '@wsh-2025/client/src/features/recommended/components/RecommendedSection';
import { useRecommended } from '@wsh-2025/client/src/features/recommended/hooks/useRecommended';

export const prefetch = async (store: ReturnType<typeof createStore>) => {
  await store.getState().features.recommended.fetchRecommendedModulesByReferenceId({ referenceId: 'entrance' });
  return null;
};

export const HomePage = () => {
  const modules = useRecommended({ referenceId: 'entrance' });
  const visibleModules = modules.slice(0, 2);

  return (
    <>
      <title>Home - AremaTV</title>

      <div className="w-full py-[48px]">
        <h1 className="mb-[16px] px-[24px] text-[32px] font-bold text-[#ffffff]">AremaTV</h1>
        {visibleModules.map((module) => {
          return (
            <div key={module.id} className="mb-[24px] px-[24px]">
              <RecommendedSection module={module} />
            </div>
          );
        })}
      </div>
    </>
  );
};
