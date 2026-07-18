import { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** 'danger' shows a red confirm button + warning icon (for destructive actions) */
  variant?: 'default' | 'danger';
}

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const DEFAULTS: Required<ConfirmOptions> = {
  title: 'Are you sure?',
  description: 'Please confirm you want to continue.',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Required<ConfirmOptions>>(DEFAULTS);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts({ ...DEFAULTS, ...(o || {}) });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  };

  const danger = opts.variant === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(v) => { if (!v) settle(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', danger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-[#1560BD]')}>
                {danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <AlertDialogTitle className="text-slate-900">{opts.title}</AlertDialogTitle>
                <AlertDialogDescription className="mt-1 whitespace-pre-line text-slate-500">{opts.description}</AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>{opts.cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settle(true)}
              className={cn(danger ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-[#1560BD] text-white hover:bg-[#124f9c]')}
            >
              {opts.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** Returns an async confirm() — resolves true if the user confirms, false if cancelled. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}
