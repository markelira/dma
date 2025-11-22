"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useTargetAudiences, useCreateTargetAudience, useUpdateTargetAudience, useDeleteTargetAudience } from "@/hooks/useTargetAudienceQueries";
import { TargetAudience } from "@/types";
import { Users, Trash2, Pencil, Plus } from "lucide-react";

interface TargetAudienceForm {
  name: string;
  description: string;
}

const emptyForm: TargetAudienceForm = {
  name: "",
  description: "",
};

export default function TargetAudiencesPage() {
  const { data: targetAudiences, isLoading } = useTargetAudiences();
  const createMutation = useCreateTargetAudience();
  const updateMutation = useUpdateTargetAudience();
  const deleteMutation = useDeleteTargetAudience();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTargetAudience, setEditTargetAudience] = useState<TargetAudience | null>(null);
  const [form, setForm] = useState<TargetAudienceForm>(emptyForm);

  // Open dialog for creating new target audience
  const openForCreate = () => {
    setEditTargetAudience(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // Open dialog for editing existing target audience
  const openForEdit = (targetAudience: TargetAudience) => {
    setEditTargetAudience(targetAudience);
    setForm({
      name: targetAudience.name,
      description: targetAudience.description || "",
    });
    setDialogOpen(true);
  };

  // Handle form submission
  const handleSave = () => {
    // Validate required fields
    if (!form.name.trim()) {
      return;
    }

    if (editTargetAudience) {
      // Update existing target audience
      updateMutation.mutate(
        {
          id: editTargetAudience.id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setForm(emptyForm);
            setEditTargetAudience(null);
          },
        }
      );
    } else {
      // Create new target audience
      createMutation.mutate(
        {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setForm(emptyForm);
          },
        }
      );
    }
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditTargetAudience(null);
      setForm(emptyForm);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Célközönségek kezelése</h1>
          <p className="text-gray-600 mt-1">
            Célközönségek létrehozása és kezelése tartalmakhoz
          </p>
        </div>
        <Button onClick={openForCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Új célközönség
        </Button>
      </div>

      {/* Target Audiences Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : !targetAudiences || targetAudiences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">Még nincs célközönség létrehozva</p>
          <Button onClick={openForCreate} variant="outline">
            Első célközönség létrehozása
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Leírás</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targetAudiences.map((targetAudience) => (
                <TableRow key={targetAudience.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      {targetAudience.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {targetAudience.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {targetAudience.description}
                      </p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openForEdit(targetAudience)}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Szerkesztés
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Törlés
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Biztosan törlöd a célközönséget?
                            </AlertDialogTitle>
                            <p className="text-sm text-gray-600 mt-2">
                              Ez a művelet nem vonható vissza. A célközönség törlése
                              csak akkor lehetséges, ha nincs egyetlen tartalomhoz
                              sem hozzárendelve.
                            </p>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: targetAudience.id })}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Törlés
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTargetAudience ? "Célközönség szerkesztése" : "Új célközönség létrehozása"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Név <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="pl. Vállalkozók"
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Leírás
              </label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Rövid leírás a célközönségről..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSaving}
            >
              Mégse
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.name.trim()}
            >
              {isSaving ? "Mentés..." : "Mentés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
