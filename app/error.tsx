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
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-sm opacity-80">
        Si el problema persiste, vuelve a la pantalla principal o inténtalo de nuevo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-3 py-2 rounded-md border"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
