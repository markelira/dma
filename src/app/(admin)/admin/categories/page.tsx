"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions as fbFunctions } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { toast } from "sonner";
import { auth } from '@/lib/firebase';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useAuthStore } from '@/stores/authStore';
import { Plus, FolderTree } from "lucide-react";

interface Category { id: string; name: string; description?: string }

interface GetCategoriesResponse {
  success: boolean;
  categories: Category[];
  error?: string;
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { authReady, user } = useAuthStore();

  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const fn = httpsCallable<{}, GetCategoriesResponse>(fbFunctions, "getCategories");
      const res = await fn({});

      if (!res.data.success) {
        throw new Error(res.data.error || 'Kategóriák betöltése sikertelen');
      }

      return res.data.categories;
    },
    // Wait for auth to be ready before calling function
    enabled: authReady && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      if (!user) {
        throw new Error('Hitelesítés szükséges');
      }

      if (editCat) {
        const fn = httpsCallable<{ id: string; name: string; description: string }, { success: boolean; error?: string }>(
          fbFunctions,
          "updateCategory"
        );
        const res = await fn({ id: editCat.id, ...payload });
        if (!res.data.success) throw new Error(res.data.error || "Frissítés hiba");
      } else {
        const fn = httpsCallable<{ name: string; description: string }, { success: boolean; error?: string }>(
          fbFunctions,
          "createCategory"
        );
        const res = await fn(payload);
        if (!res.data.success) throw new Error(res.data.error || "Létrehozás hiba");
      }
    },
    onSuccess: () => {
      toast.success(editCat ? "Kategória frissítve" : "Kategória létrehozva");
      qc.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
      setForm({ name: "", description: "" });
      setEditCat(null);
    },
    onError: (e: Error) => toast.error(e.message || "Hiba történt"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('Hitelesítés szükséges');
      }

      const fn = httpsCallable<{ id: string }, { success: boolean; error?: string }>(
        fbFunctions,
        "deleteCategory"
      );
      const res = await fn({ id });
      if (!res.data.success) throw new Error(res.data.error || "Törlés hiba");
    },
    onSuccess: () => {
      toast.success("Kategória törölve");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message || "Hiba történt"),
  });

  const openForEdit = (c: Category) => {
    setEditCat(c);
    setForm({ name: c.name, description: c.description || "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategóriák kezelése</h1>
          <p className="text-gray-500">Kategóriák létrehozása és kezelése tartalmakhoz</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#112a4b] text-white hover:bg-[#1a3d6e] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Új kategória
        </Button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112a4b]" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-white border border-gray-200 shadow-sm">
          <FolderTree className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">Még nincs kategória létrehozva</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            Első kategória létrehozása
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Leírás</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#112a4b]/10 flex items-center justify-center">
                        <FolderTree className="w-5 h-5 text-[#112a4b]" />
                      </div>
                      {c.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{c.description || <span className="text-gray-400">—</span>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openForEdit(c)}>
                      Szerkesztés
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Törlés</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Biztosan törlöd a kategóriát?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Mégse</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-red-600 hover:bg-red-700">Törlés</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditCat(null); setForm({ name: "", description: "" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? "Kategória szerkesztése" : "Új kategória"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Név *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Leírás</label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Mentés..." : "Mentés"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 