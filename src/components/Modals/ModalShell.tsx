import { Dialog } from '@headlessui/react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // Must be a static Tailwind class string (e.g. 'max-w-md') — never interpolated
  maxWidth?: string;
}

export default function ModalShell({ open, onClose, children, maxWidth = 'max-w-md' }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} p-6`}>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
