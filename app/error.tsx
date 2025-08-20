'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

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
      <div className="w-full max-w-md bg-card text-card-foreground rounded-xl border shadow-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
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
    </div>
  );
}
