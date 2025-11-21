"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, X, Loader2, Plus } from "lucide-react";
import { useCourseWizardStore } from "@/stores/courseWizardStore";
import { useAuthStore } from "@/stores/authStore";
import { useInstructors } from "@/hooks/useInstructorQueries";
import { Instructor } from "@/types";

interface Category { id: string; name: string }

import { CourseType } from '@/types';

export interface BasicInfoData {
  title: string;
  description: string;
  categoryId: string; // Keep for backward compatibility
  categoryIds?: string[]; // NEW: Support multiple categories
  instructorId: string;
  instructorIds?: string[]; // NEW: Support multiple instructors
  thumbnailUrl?: string;
  learningObjectives: string;

  // Marketing fields
  whatYouWillLearn?: string[];
  targetAudience?: string[];
}

interface Props {
  initial?: BasicInfoData;
  courseType?: CourseType;
  onSubmit: (data: BasicInfoData) => Promise<void>;
}

const schema = z.object({
  title: z.string().min(3, "A cím legalább 3 karakter legyen"),
  description: z.string().min(10, "A leírás legalább 10 karakter legyen"),
  categoryId: z.string().min(1, "Válassz legalább egy kategóriát"),
  categoryIds: z.array(z.string()).min(1, "Válassz legalább egy kategóriát").optional(),
  instructorId: z.string().min(1, "Válassz legalább egy oktatót"),
  instructorIds: z.array(z.string()).min(1, "Válassz legalább egy oktatót").optional(),
  thumbnailUrl: z.string().optional(),
  learningObjectives: z.string().min(10, "A tanulási célok legalább 10 karakter legyen"),

  // Marketing fields (all optional)
  whatYouWillLearn: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
});

export default function CourseBasicInfoStep({ initial, courseType, onSubmit }: Props) {
  const { setValidationErrors, clearValidationErrors } = useCourseWizardStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use instructor query hook
  const { data: instructors = [], isLoading: instructorsLoading } = useInstructors();

  // Marketing fields state
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(initial?.whatYouWillLearn || []);
  const [targetAudience, setTargetAudience] = useState<string[]>(initial?.targetAudience || []);

  // Selected categories state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial?.categoryIds || (initial?.categoryId ? [initial.categoryId] : [])
  );

  // Selected instructors state
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>(
    initial?.instructorIds || (initial?.instructorId ? [initial.instructorId] : [])
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
    trigger,
  } = useForm<BasicInfoData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial || {
      title: "",
      description: "",
      categoryId: "",
      instructorId: "",
      thumbnailUrl: "",
      learningObjectives: "",
    },
  });

  const { authReady, isAuthenticated, user } = useAuthStore();

  // Helper functions for array management
  const addWhatYouWillLearn = () => setWhatYouWillLearn([...whatYouWillLearn, ""]);
  const updateWhatYouWillLearn = (index: number, value: string) => {
    const updated = [...whatYouWillLearn];
    updated[index] = value;
    setWhatYouWillLearn(updated);
  };
  const removeWhatYouWillLearn = (index: number) => {
    setWhatYouWillLearn(whatYouWillLearn.filter((_, i) => i !== index));
  };

  const addTargetAudience = () => setTargetAudience([...targetAudience, ""]);
  const updateTargetAudience = (index: number, value: string) => {
    const updated = [...targetAudience];
    updated[index] = value;
    setTargetAudience(updated);
  };
  const removeTargetAudience = (index: number) => {
    setTargetAudience(targetAudience.filter((_, i) => i !== index));
  };


  // Load categories
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to be ready
      if (!authReady) {
        return;
      }

      setIsLoading(true);

      try {
        // Load categories
        const getCategoriesFn = httpsCallable(fbFunctions, 'getCategories');
        const catRes: any = await getCategoriesFn();
        if (catRes.data?.success) {
          setCategories(catRes.data.categories || []);
        } else {
          console.warn('Categories load failed:', catRes.data?.error);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error("Kategóriák betöltése sikertelen");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authReady, isAuthenticated, user]);

  // Track validation errors
  useEffect(() => {
    const errorMessages = Object.values(errors).map(e => e?.message || '').filter(Boolean);
    if (errorMessages.length > 0) {
      setValidationErrors('step1', errorMessages);
    } else {
      clearValidationErrors('step1');
    }
  }, [errors, setValidationErrors, clearValidationErrors]);

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('A fájl mérete maximum 5MB lehet');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Csak JPEG, PNG vagy WebP képek engedélyezettek');
      return;
    }

    setThumbnailUploading(true);
    setUploadProgress(0);

    try {
      // Create a reference to Firebase Storage
      const storageRef = ref(storage, `courses/thumbnails/${Date.now()}_${file.name}`);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate and update progress percentage
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          // Handle upload errors
          console.error('Thumbnail feltöltési hiba:', error);
          toast.error('Thumbnail feltöltési hiba');
          setThumbnailUploading(false);
          setUploadProgress(0);
        },
        async () => {
          // Upload completed successfully, get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setValue('thumbnailUrl', downloadURL);
            setThumbnailFile(file);
            toast.success('Thumbnail sikeresen feltöltve');
            setThumbnailUploading(false);
            setUploadProgress(0);
          } catch (err: any) {
            console.error('Download URL lekérési hiba:', err);
            toast.error('Hiba a kép URL lekérésekor');
            setThumbnailUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (err: any) {
      console.error('Thumbnail feltöltési hiba:', err);
      toast.error('Thumbnail feltöltési hiba');
      setThumbnailUploading(false);
      setUploadProgress(0);
    }
  };

  const onFormSubmit = async (data: BasicInfoData) => {
    setIsSubmitting(true);
    try {
      // Merge form data with state-managed arrays
      const completeData: BasicInfoData = {
        ...data,
        categoryId: selectedCategories[0] || '', // Primary category (first selected)
        categoryIds: selectedCategories, // All selected categories
        instructorId: selectedInstructors[0] || '', // Primary instructor (first selected)
        instructorIds: selectedInstructors, // All selected instructors
        whatYouWillLearn: whatYouWillLearn.filter(item => item.trim() !== ""),
        targetAudience: targetAudience.filter(item => item.trim() !== ""),
      };
      await onSubmit(completeData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const thumbnailUrl = watch('thumbnailUrl');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" required>Kurzus címe</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="pl. React alapok kezdőknek"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Categories - Multi-select */}
        <div className="space-y-2">
          <Label htmlFor="categories" required>Kategóriák</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kategóriák betöltése...</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`category-${cat.id}`}
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...selectedCategories, cat.id]
                        : selectedCategories.filter(id => id !== cat.id);
                      setSelectedCategories(newCategories);
                      // Update form value
                      setValue('categoryId', newCategories[0] || ''); // Primary category
                      setValue('categoryIds', newCategories);
                      trigger('categoryId');
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`category-${cat.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {cat.name}
                  </label>
                </div>
              ))
            )}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedCategories.length} kategória kiválasztva
            </p>
          )}
          {errors.categoryId && (
            <p className="text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Instructors - Multi-select */}
        <div className="space-y-2">
          <Label htmlFor="instructors" required>Oktatók</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {instructorsLoading ? (
              <p className="text-sm text-muted-foreground">Oktatók betöltése...</p>
            ) : instructors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nincs elérhető oktató</p>
            ) : (
              instructors.map((instructor) => (
                <div key={instructor.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`instructor-${instructor.id}`}
                    checked={selectedInstructors.includes(instructor.id)}
                    onChange={(e) => {
                      const newInstructors = e.target.checked
                        ? [...selectedInstructors, instructor.id]
                        : selectedInstructors.filter(id => id !== instructor.id);
                      setSelectedInstructors(newInstructors);
                      // Update form value
                      setValue('instructorId', newInstructors[0] || ''); // Primary instructor
                      setValue('instructorIds', newInstructors);
                      trigger('instructorId');
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`instructor-${instructor.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {instructor.name}
                  </label>
                </div>
              ))
            )}
          </div>
          {selectedInstructors.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedInstructors.length} oktató kiválasztva
            </p>
          )}
          {errors.instructorId && (
            <p className="text-sm text-red-600">{errors.instructorId.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" required>Leírás</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Írd le, miről szól a kurzus és mit fognak tanulni a résztvevők..."
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Learning Objectives */}
      <div className="space-y-2">
        <Label htmlFor="objectives" required>Tanulási célok</Label>
        <Textarea
          id="objectives"
          {...register("learningObjectives")}
          rows={4}
          placeholder="Mit fog megtanulni a diák a kurzus végére? (Soronként egy cél)"
          className={errors.learningObjectives ? "border-red-500" : ""}
        />
        {errors.learningObjectives && (
          <p className="text-sm text-red-600">{errors.learningObjectives.message}</p>
        )}
      </div>

      {/* Thumbnail Upload */}
      <div className="space-y-2">
        <Label>Kurzus borítókép</Label>
        {!thumbnailUrl ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
              }}
              className="hidden"
              id="thumbnail-upload"
              disabled={thumbnailUploading}
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              {thumbnailUploading ? (
                <div className="w-full space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Feltöltés... {uploadProgress}%
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Kattints vagy húzd ide a képet
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG vagy WebP (max 5MB)
                  </span>
                </>
              )}
            </label>
          </div>
        ) : (
          <div className="relative inline-block">
            <Image
              src={thumbnailUrl}
              alt="Kurzus borítókép"
              width={300}
              height={169}
              className="rounded-lg border"
            />
            <button
              type="button"
              onClick={() => {
                setValue('thumbnailUrl', '');
                setThumbnailFile(null);
              }}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center transition-colors"
              disabled={thumbnailUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Marketing Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Marketing és értékesítési tartalom</h3>

        {/* What You'll Learn */}
        <div className="space-y-2 mb-6">
          <Label>Mit fogsz tanulni?</Label>
          <div className="space-y-2">
            {whatYouWillLearn.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateWhatYouWillLearn(index, e.target.value)}
                  placeholder="pl. React komponensek létrehozása"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeWhatYouWillLearn(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWhatYouWillLearn}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Új tanulási cél hozzáadása
            </Button>
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-2 mb-6">
          <Label>Célközönség</Label>
          <div className="space-y-2">
            {targetAudience.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateTargetAudience(index, e.target.value)}
                  placeholder="pl. Kezdő fejlesztők"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTargetAudience(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTargetAudience}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Új célcsoport hozzáadása
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!isValid || isSubmitting || thumbnailUploading}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mentés...
            </>
          ) : thumbnailUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kép feltöltése...
            </>
          ) : (
            'Mentés és tovább'
          )}
        </Button>
      </div>
    </form>
  );
}