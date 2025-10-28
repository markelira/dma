'use client';

import { XCircle, ArrowLeft, HelpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  const handleRetryPayment = () => {
    // Go back to the previous page
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Fizetés megszakítva</h1>
          
          <p className="text-gray-600 mb-8">
            A fizetési folyamat megszakadt. Nem történt terhelés a kártyáján.
          </p>

          <div className="space-y-4">
            <Button onClick={handleRetryPayment} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" />
              Fizetés újrapróbálása
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Vissza a kurzusokhoz
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/support">
                <HelpCircle className="mr-2 h-5 w-5" />
                Segítség kérése
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Ha problémája van a fizetéssel, kérjük vegye fel velünk a kapcsolatot:
            </p>
            <p className="text-sm font-medium mt-2">
              support@dma.hu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}