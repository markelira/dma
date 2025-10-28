'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripe } from '@/hooks/useStripe';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Lock,
  Shield
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export function PaymentMethodManager() {
  const { 
    paymentMethods, 
    paymentMethodsLoading, 
    paymentMethodsError,
    createSetupIntent,
    isCreatingSetupIntent,
    refetchPaymentMethods
  } = useStripe();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddPaymentMethod = async () => {
    setError(null);
    
    try {
      const result = await createSetupIntent.mutateAsync();
      
      if (result.success && result.data?.clientSecret) {
        // In a real implementation, you would integrate with Stripe Elements here
        // For now, we'll show a placeholder message
        alert('Fizetési mód hozzáadása funkcionalitás implementálás alatt...');
        
        // TODO: Integrate with Stripe Elements
        // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        // const { error } = await stripe!.confirmSetup({
        //   elements,
        //   confirmParams: {
        //     return_url: window.location.href,
        //   },
        // });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hiba történt a fizetési mód hozzáadásakor';
      setError(errorMessage);
      console.error('Setup intent error:', err);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setDeletingId(paymentMethodId);
    setError(null);
    
    try {
      // TODO: Implement payment method deletion
      // This would require a Cloud Function to detach the payment method
      alert('Fizetési mód törlése funkcionalitás implementálás alatt...');
      
      setTimeout(() => {
        setDeletingId(null);
        refetchPaymentMethods();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hiba történt a fizetési mód törlésekor';
      setError(errorMessage);
      setDeletingId(null);
      console.error('Delete payment method error:', err);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const getCardBrandName = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      default:
        return brand.toUpperCase();
    }
  };

  if (paymentMethodsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (paymentMethodsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Fizetési módok</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hiba történt a fizetési módok betöltésekor: {paymentMethodsError.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Fizetési módok kezelése</span>
        </CardTitle>
        <CardDescription>
          Mentett bankkártyák és fizetési módok kezelése
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add new payment method button */}
        <Button
          onClick={handleAddPaymentMethod}
          disabled={isCreatingSetupIntent}
          variant="outline"
          className="w-full"
        >
          {isCreatingSetupIntent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Betöltés...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Új fizetési mód hozzáadása
            </>
          )}
        </Button>

        {/* Payment methods list */}
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Mentett fizetési módok
            </h4>
            
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getCardBrandIcon(method.card?.brand || '')}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {getCardBrandName(method.card?.brand || '')}
                      </span>
                      <span className="text-muted-foreground">
                        •••• {method.card?.last4}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Lejárat: {method.card?.expMonth}/{method.card?.expYear}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mentett
                  </Badge>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === method.id}
                      >
                        {deletingId === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Fizetési mód törlése</AlertDialogTitle>
                        <AlertDialogDescription>
                          Biztos benne, hogy törölni szeretné ezt a fizetési módot?
                          <br />
                          <span className="font-medium">
                            {getCardBrandName(method.card?.brand || '')} •••• {method.card?.last4}
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Törlés
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nincs mentett fizetési mód</p>
            <p className="text-sm">
              Adjon hozzá bankkártyát vagy egyéb fizetési módot a gyorsabb vásárláshoz
            </p>
          </div>
        )}

        {/* Security notice */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Biztonságos tárolás</span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>Minden fizetési adat titkosítva van tárolva</span>
            </p>
            <p>• A kártyaadatokat a Stripe kezeli PCI DSS szabvány szerint</p>
            <p>• Sosem tároljuk a teljes kártyaszámokat</p>
            <p>• SSL/TLS titkosítás minden adatátvitelhez</p>
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Hasznos tudnivalók:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>A mentett fizetési módok automatikusan használhatók a következő vásárlásoknál</li>
            <li>Bármikor törölheti vagy frissítheti a mentett kártyákat</li>
            <li>Előfizetések esetén automatikus megújítás történik</li>
            <li>Probléma esetén vegye fel velünk a kapcsolatot</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}