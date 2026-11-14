import * as React from 'react'
import { cn } from '@/lib/utils'
export function NativeSelect({ className, ...p }: React.ComponentProps<'select'>) {
  return <select className={cn('h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', className)} {...p} />
}