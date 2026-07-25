import { createPortal } from 'react-dom'
import { SuccessDialog } from './SuccessDialog'
import { useSuccessDialog } from '../../store/successDialog'

/**
 * App-wide success modal, mounted once in AdminLayout and driven by the
 * `useSuccessDialog` store. Any module can trigger it via `showSuccessDialog()`.
 */
export function GlobalSuccessDialog() {
  const { open, title, message, close } = useSuccessDialog()
  if (!open) return null
  return createPortal(
    <SuccessDialog open title={title} message={message} onOk={close} />,
    document.body,
  )
}
