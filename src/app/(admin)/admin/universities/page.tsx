'use client'

export const dynamic = 'force-dynamic';

import { useUniversities } from '@/hooks/useUniversityQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Building2, Users, BookOpen } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useCreateUniversity } from '@/hooks/useUniversityQueries'
import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'

function CreateUniversityForm() {
  const createMutation = useCreateUniversity()
  const [form, setForm] = useState({ name: '', slug: '', revenueSharePct: 70 })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'revenueSharePct' ? Number(value) : value }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Név</label>
        <Input name="name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Slug</label>
        <Input name="slug" value={form.slug} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Revenue Share %</label>
        <Input name="revenueSharePct" type="number" step="1" min="0" max="100" value={form.revenueSharePct} onChange={handleChange} />
      </div>
      <Button type="submit" disabled={createMutation.status==='pending'} className="w-full">{createMutation.status==='pending' ? 'Létrehozás...' : 'Létrehozás'}</Button>
    </form>
  )
}

export default function AdminUniversitiesPage() {
  const { data: universities, isLoading, error } = useUniversities()
  const [search, setSearch] = useState('')

  const filtered = universities?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.slug.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112a4b]" />
      </div>
    )
  }
  if (error) {
    return <div className="text-red-600">Hiba az egyetemek betöltésekor: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Egyetemek kezelése</h1>
          <p className="text-gray-500">Egyetemek és partnerek kezelése</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-[#112a4b] text-white hover:bg-[#1a3d6e] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Új Egyetem
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Új Egyetem Létrehozása</AlertDialogTitle>
            </AlertDialogHeader>
            <CreateUniversityForm />
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
        <label className="text-sm font-medium text-gray-900 mb-2 block">Keresés</label>
        <Input placeholder="Keresés név vagy slug alapján..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Universities Table */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Egyetemek ({filtered.length})</h3>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tartalmak</TableHead>
                <TableHead>Felhasználók</TableHead>
                <TableHead>Revenue Share %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-accent" onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = `/admin/universities/${u.id}`
                }}>
                  <TableCell className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4" />{u.name}</TableCell>
                  <TableCell>{u.slug}</TableCell>
                  <TableCell className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{u._count?.courses ?? 0}</TableCell>
                  <TableCell className="flex items-center gap-1"><Users className="h-4 w-4" />{u._count?.users ?? 0}</TableCell>
                  <TableCell>{u.revenueSharePct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 