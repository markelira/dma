'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Download, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Privacy Settings Component
 *
 * GDPR-compliant privacy management:
 * - Export personal data (Article 15 & 20)
 * - Request account deletion (Article 17)
 */
export function PrivacySettings() {
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      toast.error('Bejelentkezés szükséges');
      return;
    }

    setIsExporting(true);
    try {
      const exportUserDataFn = httpsCallable(functions, 'exportUserData');
      const result = await exportUserDataFn({});
      const data = result.data as { success: boolean; data: unknown };

      if (data.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Adatok sikeresen exportálva!');
      }
    } catch (error: unknown) {
      console.error('Export error:', error);
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
      toast.error(`Hiba az exportálás során: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) {
      toast.error('Bejelentkezés szükséges');
      return;
    }

    if (confirmEmail !== user.email) {
      toast.error('Az email cím nem egyezik');
      return;
    }

    setIsDeleting(true);
    try {
      const requestDeletionFn = httpsCallable(functions, 'requestAccountDeletion');
      const result = await requestDeletionFn({ confirmEmail });
      const data = result.data as { success: boolean; message: string; scheduledDeletionDate: string };

      if (data.success) {
        const deletionDate = new Date(data.scheduledDeletionDate).toLocaleDateString('hu-HU');
        toast.success(`${data.message} Törlés időpontja: ${deletionDate}`);
        setShowDeleteConfirm(false);
        setConfirmEmail('');
      }
    } catch (error: unknown) {
      console.error('Deletion request error:', error);
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
      toast.error(`Hiba: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Adataim letöltése
          </CardTitle>
          <CardDescription>
            Töltsd le az összes személyes adatod JSON formátumban. Ez tartalmazza a
            profilodat, beiratkozásaidat, tanulási előrehaladásodat és egyéb adataidat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportálás...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Adatok exportálása
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Fiók törlése
          </CardTitle>
          <CardDescription>
            A fiók törlése visszafordíthatatlan. Minden adatod, beleértve a
            beiratkozásaidat, tanulási előrehaladásodat és profilodat véglegesen
            töröljük. A törlési kérés után 30 napig visszavonhatod a döntésedet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Fiók törlése
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Biztosan törölni szeretnéd a fiókodat?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Ez a művelet <strong>30 nap múlva</strong> véglegesen törli a fiókodat
                    és az összes kapcsolódó adatot. A törlési kérést 30 napon belül
                    visszavonhatod.
                  </p>
                  <p className="text-red-600 font-medium">
                    A törlés után elveszíted:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Minden kurzus beiratkozásodat</li>
                    <li>Tanulási előrehaladásodat és eredményeidet</li>
                    <li>Profilodat és beállításaidat</li>
                    <li>Megszerzett tanúsítványaidat</li>
                  </ul>
                  <div className="pt-4">
                    <Label htmlFor="confirm-email">
                      Add meg az email címedet a megerősítéshez: <strong>{user?.email}</strong>
                    </Label>
                    <Input
                      id="confirm-email"
                      type="email"
                      placeholder="email@pelda.hu"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmEmail('')}>
                  Mégsem
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRequestDeletion}
                  disabled={isDeleting || confirmEmail !== user?.email}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Feldolgozás...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Törlés indítása
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Info about GDPR rights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Az adatvédelmi jogaidról</p>
              <p className="mt-1 text-blue-700">
                A GDPR (Általános Adatvédelmi Rendelet) értelmében jogod van hozzáférni,
                exportálni és törölni a személyes adataidat. További információkért
                olvasd el az{' '}
                <a href="/privacy" className="underline hover:text-blue-900">
                  Adatvédelmi tájékoztatónkat
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacySettings;
