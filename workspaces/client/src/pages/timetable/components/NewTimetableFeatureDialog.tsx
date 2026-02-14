import { useCloseNewFeatureDialog } from '@wsh-2025/client/src/pages/timetable/hooks/useCloseNewFeatureDialog';

interface Props {
  isOpen: boolean;
}

export const NewTimetableFeatureDialog = ({ isOpen }: Props) => {
  const onClose = useCloseNewFeatureDialog();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000077]"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="w-[480px] shrink-0 grow-0 rounded-[8px] border-[2px] border-solid border-[#FFFFFF1F] bg-[#171717] px-[16px] py-[32px]"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-[16px] flex w-full flex-row justify-center">
          <img alt="" className="object-contain" decoding="async" height={36} src="/public/arema.webp" width={98} />
        </div>

        <h2 className="mb-[24px] text-center text-[24px] font-bold">拡大・縮小機能を新しく追加</h2>

        <p className="mb-[24px] text-[14px] text-[#999999]">
          番組タイトルをドラッグして、表示カラムの幅を拡大・縮小できます。
        </p>

        <div className="flex flex-row justify-center">
          <button
            className="block flex w-[160px] flex-row items-center justify-center rounded-[4px] bg-[#1c43d1] p-[12px] text-[14px] font-bold text-[#ffffff] disabled:opacity-50"
            type="button"
            onClick={onClose}
          >
            試してみる
          </button>
        </div>
      </div>
    </div>
  );
};
