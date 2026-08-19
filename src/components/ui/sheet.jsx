import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetPortal = DialogPrimitive.Portal;
export const SheetClose = DialogPrimitive.Close;
export const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => <DialogPrimitive.Overlay ref={ref} data-radix-dialog-overlay="" className={cn('fixed inset-0 z-[150] bg-black/50', className)} {...props}/>);
SheetOverlay.displayName = 'SheetOverlay';
export const SheetContent = React.forwardRef(({ className, children, closeLabel = 'Close', ...props }, ref) => <SheetPortal><SheetOverlay/><DialogPrimitive.Content ref={ref} className={cn('fixed inset-y-0 right-0 z-[151] grid h-full w-full max-w-md grid-rows-[auto_minmax(0,1fr)] border-l bg-background shadow-lg duration-300 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right', className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"><X className="h-5 w-5"/><span className="sr-only">{closeLabel}</span></DialogPrimitive.Close></DialogPrimitive.Content></SheetPortal>);
SheetContent.displayName = 'SheetContent';
export const SheetHeader = ({ className, ...props }) => <div className={cn('grid gap-1.5 border-b px-6 py-5 text-left', className)} {...props}/>;
export const SheetTitle = React.forwardRef(({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props}/>);
SheetTitle.displayName = 'SheetTitle';
export const SheetDescription = React.forwardRef(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}/>);
SheetDescription.displayName = 'SheetDescription';
