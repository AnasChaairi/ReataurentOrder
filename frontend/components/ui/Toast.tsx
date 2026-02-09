"use client";

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#3B2316',
          color: '#F5F0EB',
          border: '1px solid #5C3D2E',
        },
      }}
      richColors
      closeButton
    />
  );
}
