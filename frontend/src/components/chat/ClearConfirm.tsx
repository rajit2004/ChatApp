export default function ClearConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        className="absolute inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onCancel}
      />
      <div
        className="absolute z-50 bg-[#202c33] rounded-xl p-5 flex flex-col gap-4 shadow-2xl"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "280px" }}
      >
        <p className="text-white font-semibold text-sm">Clear all messages?</p>
        <p className="text-[#8696a0] text-xs leading-relaxed">
          This will delete all messages for everyone. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-[#2a3942] text-white text-sm hover:bg-[#3a4952]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}