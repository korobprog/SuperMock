import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';

interface ExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function ExitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onComplete,
  isLoading = false,
}: ExitConfirmDialogProps) {
  const { t } = useAppTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t('interview.exitConfirmTitle') || 'Завершить собеседование?'}
          </DialogTitle>
          <DialogDescription>
            {t('interview.exitConfirmDescription') ||
              'Выберите, как вы хотите завершить собеседование:'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {/* Опция завершения */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="font-medium text-green-800 mb-2">
                {t('interview.completeOption') || '✅ Завершить собеседование'}
              </h4>
              <p className="text-sm text-green-700 mb-3">
                {t('interview.completeDescription') ||
                  'Собеседование будет помечено как завершенное. Вы сможете оставить фидбек о партнере.'}
              </p>
              <Button
                onClick={onComplete}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('common.processing') || 'Обработка...'}
                  </div>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('interview.completeInterview') ||
                      'Завершить собеседование'}
                  </>
                )}
              </Button>
            </div>

            {/* Опция выхода */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h4 className="font-medium text-orange-800 mb-2">
                {t('interview.exitOption') || '🚪 Просто выйти'}
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                {t('interview.exitDescription') ||
                  'Собеседование останется активным. Вы можете вернуться позже.'}
              </p>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {t('interview.justExit') || 'Просто выйти'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('common.cancel') || 'Отмена'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
