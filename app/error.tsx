'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[400px] container flex items-center justify-center p-6">
      <div className="text-center border-red-200 dark:border-red-800 rounded-xl border bg-card p-6">
        <div className="mx-auto mb-4 w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Si el problema persiste, vuelve a la pantalla principal o inténtalo de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
