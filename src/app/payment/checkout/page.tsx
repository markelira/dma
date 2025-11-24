'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CheckoutForm } from '@/components/payment/CheckoutForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get checkout parameters from URL
  const courseId = searchParams.get('courseId');
  const priceId = searchParams.get('priceId');
  const amount = parseInt(searchParams.get('amount') || '0');
  const currency = searchParams.get('currency') || 'HUF';
  const mode = (searchParams.get('mode') as 'payment' | 'subscription') || 'payment';
  const description = searchParams.get('description') || 'ELIRA vásárlás';

  // Example features based on mode
  const features = mode === 'subscription' 
    ? [
        'Hozzáférés minden tartalomhoz',
        'Korlátlan videó megtekintés',
        'Letölthető anyagok',
        'Prioritás támogatás',
        'Haladás követése',
        'Tanúsítványok'
      ]
    : [
        'Teljes tartalom hozzáférés',
        'Minden lecke és anyag',
        'Letölthető tartalmak',
        'Tanúsítvány a befejezéskor',
        '30 napos garancia'
      ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Bejelentkezés szükséges</CardTitle>
            <CardDescription>
              A fizetéshez előbb be kell jelentkeznie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Bejelentkezés
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!amount || amount <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Hibás fizetési adatok</CardTitle>
            <CardDescription>
              A fizetési összeg nem érvényes vagy hiányzó.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSuccess = (result: any) => {
    console.log('Payment successful:', result);
    // Success page will be handled by redirect
  };

  const handleError = (error: any) => {
    console.error('Payment error:', error);
    // Error handling is done within the CheckoutForm
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Biztonságos fizetés</h1>
            <p className="text-muted-foreground">
              Fejezze be vásárlását biztonságos környezetben
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              courseId={courseId || undefined}
              priceId={priceId || undefined}
              amount={amount}
              currency={currency}
              mode={mode}
              description={description}
              features={features}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Biztonság</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>256-bit SSL titkosítás</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>PCI DSS megfelelő</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Stripe által védett</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Nem tároljuk kártya adatokat</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Elfogadott kártyák</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <Badge variant="outline" className="text-xs p-1 text-center">
                    Visa
                  </Badge>
                  <Badge variant="outline" className="text-xs p-1 text-center">
                    MC
                  </Badge>
                  <Badge variant="outline" className="text-xs p-1 text-center">
                    AMEX
                  </Badge>
                  <Badge variant="outline" className="text-xs p-1 text-center">
                    Maestro
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minden nemzetközi bankkártya elfogadott. 
                  A fizetés biztonságáért a Stripe felel.
                </p>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Segítségre van szüksége?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ha problémát tapasztal a fizetés során, 
                  ügyfélszolgálatunk készséggel segít.
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@dma.hu" className="text-blue-600 hover:underline">
                      support@dma.hu
                    </a>
                  </div>
                  <div>
                    <strong>Telefon:</strong>{' '}
                    <a href="tel:+36-1-234-5678" className="text-blue-600 hover:underline">
                      +36-1-234-5678
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Hétfő-Péntek: 9:00-17:00
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}