import Button from "../ui/Button";

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
        className="absolute inset-0 z-40 bg-black/50"
        onClick={onCancel}
      />
      <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-surface border border-border rounded-xl p-5 shadow-2xl">
        <p className="text-text font-semibold text-sm">Clear all messages?</p>
        <p className="text-muted text-xs mt-2 leading-relaxed">
          This will delete all messages for everyone. This cannot be undone.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={onCancel} fullWidth>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            fullWidth
            className="!bg-danger !text-white hover:!bg-danger/90"
          >
            Clear
          </Button>
        </div>
      </div>
    </>
  );
}
