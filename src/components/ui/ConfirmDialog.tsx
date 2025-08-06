'use client'

import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Modal } from './Modal'
import { LoadingSpinner } from './LoadingSpinner'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  loading?: boolean
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false
}: ConfirmDialogProps) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'danger':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getIconBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100'
      case 'danger':
        return 'bg-red-100'
      case 'success':
        return 'bg-green-100'
      default:
        return 'bg-blue-100'
    }
  }

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonColor()}`}
          >
            {loading && <LoadingSpinner size="sm" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
