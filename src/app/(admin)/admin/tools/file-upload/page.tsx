"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import { functions } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FileUploadToolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Kérlek, válassz ki egy fájlt feltöltéshez.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // TESZTELÉSI MÓD: Közvetlen HTTP hívás a Cloud Function-re
      console.log("🧪 Tesztelési mód: Közvetlen HTTP hívás...");
      
      const response = await fetch(`http://localhost:5001/DMA-PROJECT-ID/us-central1/getSignedUploadUrl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            fileName: file.name,
            fileType: file.type,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Cloud Function hiba:", errorText);
        throw new Error(`Cloud Function hiba: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Cloud Function válasz:", result);

      const { signedUrl, publicUrl } = result.result;

      if (!signedUrl) {
        throw new Error("Nem sikerült aláírt URL-t generálni.");
      }

      setProgress(50);

      // 2. LÉPÉS: A fájl feltöltése közvetlenül a Cloud Storage-ba a kapott URL-re
      console.log("📤 Fájl feltöltése a Cloud Storage-ba...");
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Hiba a fájl feltöltése során.");
      }

      setProgress(100);
      setUploadedUrl(publicUrl);
      toast.success("Sikeres feltöltés!");
      console.log("🎉 Fájl sikeresen feltöltve:", publicUrl);
      
    } catch (error: any) {
      console.error("❌ Hiba a fájlfeltöltés során:", error);
      toast.error(error.message || "Feltöltési hiba");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Eszközök - Fájl Feltöltés</h1>
        <p className="text-gray-600 mt-2">Firebase Storage fájl feltöltés tesztelése</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fájl Feltöltés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                setFile(selected);
              }
            }}
            disabled={isUploading}
          />

          {progress > 0 && <Progress value={progress} />}

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? "Feltöltés..." : "Feltöltés"}
          </Button>

          {uploadedUrl && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Sikeres feltöltés!</p>
              <p className="text-sm text-gray-600">Publikus URL:</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-secondary underline break-all"
              >
                {uploadedUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 