'use client'

import { useEffect, useRef } from 'react'
import { LucideIcon } from 'lucide-react'

interface DropdownItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

interface DropdownMenuProps {
  isOpen: boolean
  onToggle: () => void
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export const DropdownMenu = ({
  isOpen,
  onToggle,
  trigger,
  items,
  align = 'right',
  className = ''
}: DropdownMenuProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onToggle])

  const alignmentClasses = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={onToggle}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {items.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick()
                    }
                  }}
                  disabled={item.disabled}
                  className={`
                    group flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors
                    ${item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : item.danger
                        ? 'text-red-700 hover:bg-red-50 hover:text-red-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  role="menuitem"
                >
                  {Icon && (
                    <Icon className={`h-4 w-4 ${
                      item.disabled
                        ? 'text-gray-400'
                        : item.danger
                          ? 'text-red-500'
                          : 'text-gray-500'
                    }`} />
                  )}
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
