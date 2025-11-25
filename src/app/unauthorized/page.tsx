'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ArrowLeft,
  Mail,
  Phone
} from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, refreshUser, loading } = useAuth();

  const handleRefreshPermissions = async () => {
    try {
      await refreshUser();
      // After refresh, try to go back to where they came from
      router.back();
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'student': 'Hallgató',
      'instructor': 'Oktató',
      'university_admin': 'Egyetemi Adminisztrátor',
      'admin': 'Rendszer Adminisztrátor'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Error Card */}
        <Card className="border-red-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900">
                Hozzáférés megtagadva
              </h1>

              {/* Error Description */}
              <div className="space-y-2">
                <p className="text-gray-600">
                  Nincs megfelelő jogosultsága az oldal megtekintéséhez.
                </p>
                
                {user && (
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <strong>Jelenlegi szerepkör:</strong> {user.role ? getRoleLabel(user.role) : 'Ismeretlen'}
                    </p>
                    {user.universityId && (
                      <p>
                        <strong>Egyetem:</strong> {user.universityId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => router.back()}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Vissza
                  </Button>
                  <Button 
                    onClick={() => router.push('/')}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Főoldal
                  </Button>
                </div>

                {user && (
                  <Button 
                    onClick={handleRefreshPermissions}
                    variant="outline"
                    disabled={loading}
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Jogosultságok frissítése
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Segítségre van szüksége?</strong>
            <div className="mt-2 space-y-1 text-sm">
              <p>Ha úgy érzi, hogy jogosultsága kellene legyen ehhez az oldalhoz:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Ellenőrizze, hogy a megfelelő szerepkörrel rendelkezik-e</li>
                <li>Próbálja meg frissíteni a jogosultságait</li>
                <li>Lépjen kapcsolatba a rendszer adminisztrátorral</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Contact Information */}
        <Card className="bg-brand-secondary/5 border-brand-secondary/20">
          <CardContent className="pt-4">
            <h3 className="font-bold text-brand-secondary-hover mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Támogatás elérhetőségek
            </h3>
            <div className="space-y-2 text-sm text-brand-secondary-hover">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>support@dma.hu</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>+36 1 234 5678</span>
              </div>
            </div>
            <p className="text-xs text-brand-secondary mt-3">
              Kérjük, adja meg a felhasználói fiókját és a hozzáférni kívánt oldalt.
            </p>
          </CardContent>
        </Card>

        {/* Additional Information for Different Roles */}
        {user && user.role && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <h3 className="font-bold text-gray-900 mb-2">
                Információ a szerepköréről
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                {user.role === 'student' && (
                  <div>
                    <p><strong>Hallgatói jogosultságok:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Tartalmak megtekintése és jelentkezés</li>
                      <li>Leckék tanulmányozása</li>
                      <li>Kvízek kitöltése</li>
                      <li>Profil kezelése</li>
                    </ul>
                  </div>
                )}

                {user.role === 'instructor' && (
                  <div>
                    <p><strong>Oktatói jogosultságok:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Tartalmak létrehozása és szerkesztése</li>
                      <li>Hallgatói eredmények megtekintése</li>
                      <li>Tananyagok feltöltése</li>
                      <li>Analitikák megtekintése</li>
                    </ul>
                  </div>
                )}

                {user.role === 'university_admin' && (
                  <div>
                    <p><strong>Egyetemi adminisztrátori jogosultságok:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Egyetemen belüli felhasználók kezelése</li>
                      <li>Tartalmak jóváhagyása</li>
                      <li>Tanszékek kezelése</li>
                      <li>Jelentések generálása</li>
                    </ul>
                  </div>
                )}

                {user.role === 'admin' && (
                  <div>
                    <p><strong>Rendszer adminisztrátori jogosultságok:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Teljes rendszer hozzáférés</li>
                      <li>Minden felhasználó kezelése</li>
                      <li>Rendszerbeállítások</li>
                      <li>Biztonsági naplók</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}