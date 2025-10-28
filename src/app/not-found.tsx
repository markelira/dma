import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-lg text-gray-700 mb-6">Az oldal nem található.</p>
      <Link href="/" className="text-primary font-semibold underline">Vissza a főoldalra</Link>
    </main>
  )
} 