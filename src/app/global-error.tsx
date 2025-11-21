'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <h2 className="text-2xl font-bold mb-4">Valami elromlott!</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Próbáld újra
          </button>
        </div>
      </body>
    </html>
  )
}
