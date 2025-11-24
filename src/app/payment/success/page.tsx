'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Get course ID from URL
    const id = searchParams.get('courseId');
    setCourseId(id);

    // Redirect to dashboard after delay if no course ID
    if (!id) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Sikeres fizetés!</h1>
          
          <p className="text-gray-600 mb-8">
            Köszönjük a vásárlást! A visszaigazolást elküldtük az email címére.
          </p>

          <div className="space-y-4">
            {courseId ? (
              <>
                <Button asChild className="w-full" size="lg">
                  <Link href={`/courses/${courseId}/learn`}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Tartalom megkezdése
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/my-learning">
                    Ugrás a beiratkozásaimhoz
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Műszerfal megnyitása
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Számlája hamarosan elérhető lesz:
            </p>
            <Button variant="ghost" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Számla letöltése
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}