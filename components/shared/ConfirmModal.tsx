import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'אישור',
  loading,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-yellow-400" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-2">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          ביטול
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
