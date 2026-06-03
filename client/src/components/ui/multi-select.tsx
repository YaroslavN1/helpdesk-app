import { Menu } from '@base-ui/react/menu'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  options: Option<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
  disabled?: boolean
}

const checkboxItemClass = 'flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-muted'

export function MultiSelect<T extends string>({ label, options, selected, onChange, disabled }: Props<T>) {
  function updateSelected(value: T) {
    const updatedSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(updatedSelected)
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={disabled}
        className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-1.5')}
      >
        {selected.length > 0 && (
          <span className="rounded-full bg-primary text-primary-foreground text-xs leading-none px-1.5 py-0.5">
            {selected.length}
          </span>
        )}
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup className="z-50 min-w-36 rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10 outline-none">
            {options.map(option => (
              <Menu.CheckboxItem
                key={option.value}
                checked={selected.includes(option.value)}
                onCheckedChange={() => updateSelected(option.value)}
                closeOnClick={false}
                className={checkboxItemClass}
              >
                <Menu.CheckboxItemIndicator className="flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-3 w-3" />
                </Menu.CheckboxItemIndicator>
                {option.label}
              </Menu.CheckboxItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
