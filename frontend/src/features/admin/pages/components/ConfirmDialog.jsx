import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  onConfirm,
  destructive = false,
  testId,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="max-w-md rounded-2xl border border-white/10 bg-[#0D0F1A]"
        data-testid={testId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-white">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-[color:var(--kti-text-dim)]">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white hover:bg-white/[0.08]"
            data-testid={testId ? `${testId}-cancel` : undefined}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid={testId ? `${testId}-confirm` : undefined}
            className={`rounded-xl border px-5 py-2.5 text-sm font-semibold text-white ${
              destructive
                ? "border-red-500/45 bg-red-500/20 hover:bg-red-500/30"
                : "border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] hover:bg-[rgba(124,104,225,0.32)]"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
