'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripe } from '@/hooks/useStripe';
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function SubscriptionManager() {
  const { 
    subscriptions, 
    subscriptionsLoading, 
    subscriptionsError,
    cancelSubscriptionWithConfirmation,
    isCancellingSubscription,
    refetchSubscriptions
  } = useStripe();

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Lemondva</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge variant="default">Aktív</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Lejárt</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Törölve</Badge>;
      case 'incomplete':
        return <Badge variant="outline">Hiányos</Badge>;
      case 'trialing':
        return <Badge variant="outline">Próbaidőszak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancellingId(subscriptionId);
    try {
      await cancelSubscriptionWithConfirmation?.(subscriptionId);
      refetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setCancellingId(null);
    }
  };

  if (subscriptionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Hiba történt az előfizetések betöltésekor: {subscriptionsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Előfizetések</span>
          </CardTitle>
          <CardDescription>
            Jelenleg nincs aktív előfizetése
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Az előfizetéssel korlátlan hozzáférést kaphat a platformon található összes kurzushoz.
          </p>
          <Button className="mt-4" asChild>
            <a href="/subscribe">Előfizetés választása</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Előfizetések kezelése</h2>
      </div>

      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Előfizetés #{subscription.id.slice(-8)}
                </CardTitle>
                {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
              </div>
              <CardDescription>
                {subscription.items.map((item, index) => (
                  <span key={item.id}>
                    {formatAmount(item.amount, item.currency)}
                    {item.interval && ` / ${item.interval === 'month' ? 'hó' : 'év'}`}
                    {index < subscription.items.length - 1 && ', '}
                  </span>
                ))}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Jelenlegi időszak:</span>
                    </div>
                    <p>
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Lemondás dátuma:</span>
                      </div>
                      <p className="text-destructive">
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelSubscription(subscription.id)}
                      disabled={isCancellingSubscription || cancellingId === subscription.id}
                    >
                      {cancellingId === subscription.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Lemondás...
                        </>
                      ) : (
                        'Előfizetés lemondása'
                      )}
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <a href="#payment-methods">Fizetési mód módosítása</a>
                    </Button>
                  </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Az előfizetése lemondásra került, de továbbra is hozzáférhet a tartalmakhoz {formatDate(subscription.currentPeriodEnd)} napig.
                    </AlertDescription>
                  </Alert>
                )}

                {subscription.status === 'past_due' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Az előfizetési díj befizetése sikertelen volt. Kérjük, frissítse fizetési adatait.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          Az előfizetés lemondása esetén a jelenlegi számlázási időszak végéig továbbra is hozzáférhet a szolgáltatásokhoz.
          A lemondás után nem kerül sor további terhelésre.
        </p>
      </div>
    </div>
  );
}