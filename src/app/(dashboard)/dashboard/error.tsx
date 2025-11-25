'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-xl font-bold">Hoppá, hiba történt!</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Egy váratlan hiba merült fel a vezérlőpult betöltése közben.
      </p>
      <pre className="mt-4 text-xs text-destructive">{error.message}</pre>
      <Button
        onClick={
          // A szegmens újrarajzolásával megpróbáljuk helyreállítani
          () => reset()
        }
        className="mt-6"
      >
        Újrapróbálkozás
      </Button>
    </div>
  )
}
