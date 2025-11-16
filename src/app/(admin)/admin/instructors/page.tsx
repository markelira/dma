"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useInstructors, useCreateInstructor, useUpdateInstructor, useDeleteInstructor } from "@/hooks/useInstructorQueries";
import { Instructor } from "@/types";
import { User, Trash2, Pencil, Plus } from "lucide-react";

interface InstructorForm {
  name: string;
  title: string;
  bio: string;
  profilePictureUrl: string;
}

const emptyForm: InstructorForm = {
  name: "",
  title: "",
  bio: "",
  profilePictureUrl: "",
};

export default function InstructorsPage() {
  const { data: instructors, isLoading } = useInstructors();
  const createMutation = useCreateInstructor();
  const updateMutation = useUpdateInstructor();
  const deleteMutation = useDeleteInstructor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [form, setForm] = useState<InstructorForm>(emptyForm);

  // Open dialog for creating new instructor
  const openForCreate = () => {
    setEditInstructor(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // Open dialog for editing existing instructor
  const openForEdit = (instructor: Instructor) => {
    setEditInstructor(instructor);
    setForm({
      name: instructor.name,
      title: instructor.title || "",
      bio: instructor.bio || "",
      profilePictureUrl: instructor.profilePictureUrl || "",
    });
    setDialogOpen(true);
  };

  // Handle form submission
  const handleSave = () => {
    // Validate required fields
    if (!form.name.trim()) {
      return;
    }

    if (editInstructor) {
      // Update existing instructor
      updateMutation.mutate(
        {
          id: editInstructor.id,
          name: form.name.trim(),
          title: form.title.trim() || undefined,
          bio: form.bio.trim() || undefined,
          profilePictureUrl: form.profilePictureUrl.trim() || undefined,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setForm(emptyForm);
            setEditInstructor(null);
          },
        }
      );
    } else {
      // Create new instructor
      createMutation.mutate(
        {
          name: form.name.trim(),
          title: form.title.trim() || undefined,
          bio: form.bio.trim() || undefined,
          profilePictureUrl: form.profilePictureUrl.trim() || undefined,
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
      setEditInstructor(null);
      setForm(emptyForm);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Oktatók kezelése</h1>
          <p className="text-gray-600 mt-1">
            Oktatók létrehozása és kezelése kurzusokhoz
          </p>
        </div>
        <Button onClick={openForCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Új oktató
        </Button>
      </div>

      {/* Instructors Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : !instructors || instructors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">Még nincs oktató létrehozva</p>
          <Button onClick={openForCreate} variant="outline">
            Első oktató létrehozása
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Beosztás</TableHead>
                <TableHead>Bio</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {instructor.profilePictureUrl ? (
                        <img
                          src={instructor.profilePictureUrl}
                          alt={instructor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      {instructor.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {instructor.title || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {instructor.bio ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {instructor.bio}
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
                        onClick={() => openForEdit(instructor)}
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
                              Biztosan törlöd az oktatót?
                            </AlertDialogTitle>
                            <p className="text-sm text-gray-600 mt-2">
                              Ez a művelet nem vonható vissza. Az oktató törlése
                              csak akkor lehetséges, ha nincs egyetlen kurzushoz
                              sem hozzárendelve.
                            </p>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: instructor.id })}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editInstructor ? "Oktató szerkesztése" : "Új oktató létrehozása"}
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
                placeholder="pl. Dr. Kovács János"
                required
              />
            </div>

            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Beosztás
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="pl. Vezető Marketing Oktató"
              />
            </div>

            {/* Bio Field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bio/Bemutatkozás
              </label>
              <Textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Rövid bemutatkozás az oktatóról, szakmai háttere, tapasztalatai..."
              />
            </div>

            {/* Profile Picture URL Field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Profilkép URL
              </label>
              <Input
                type="url"
                value={form.profilePictureUrl}
                onChange={(e) =>
                  setForm({ ...form, profilePictureUrl: e.target.value })
                }
                placeholder="https://example.com/photo.jpg"
              />
              {form.profilePictureUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Előnézet:</p>
                  <img
                    src={form.profilePictureUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
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
