'use client';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main className="min-h-screen flex flex-col items-center justify-center bg-white">
          <h1 className="text-5xl font-bold text-red-600 mb-4">500</h1>
          <p className="text-lg text-gray-700 mb-6">Hiba történt.</p>
          <button
            onClick={() => reset()}
            className="text-primary font-bold underline"
          >
            Próbáld újra
          </button>
        </main>
      </body>
    </html>
  );
}
