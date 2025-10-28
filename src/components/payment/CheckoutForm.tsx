'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
  Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getStripe, stripeElementsOptions, formatHungarianCurrency } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Award
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  courseId?: string;
  priceId?: string;
  amount: number;
  currency: string;
  mode: 'payment' | 'subscription';
  description: string;
  features?: string[];
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

// Inner form component that has access to Stripe context
function CheckoutFormInner({
  courseId,
  priceId,
  amount,
  currency,
  mode,
  description,
  features = [],
  onSuccess,
  onError
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const formatCurrency = formatHungarianCurrency;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      // Development mode: Mock payment success
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Simulating payment success');
        setMessage('Mock payment sikeres! Átirányítás...');
        setMessageType('success');
        
        setTimeout(() => {
          onSuccess?.({
            success: true,
            sessionId: 'mock_session_' + Date.now(),
            courseId,
            mode,
            amount
          });
        }, 1500);
        return;
      }

      if (!stripe || !elements) {
        setMessage('Stripe még nem töltődött be. Kérjük várjon...');
        setMessageType('error');
        return;
      }

      // Create checkout session first
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const sessionData = {
        mode,
        ...(courseId && { courseId }),
        ...(priceId && { priceId }),
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}${courseId ? `&courseId=${courseId}` : ''}`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        metadata: {
          description,
          userId: user?.uid || '',
          ...(courseId && { courseId })
        }
      };

      const result = await createCheckoutSession(sessionData);
      const sessionResult = result.data as any;

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Nem sikerült létrehozni a fizetési munkamenetet');
      }

      // Redirect to Stripe Checkout
      if (sessionResult.data?.url) {
        window.location.href = sessionResult.data.url;
        return;
      }

      // If we have a client secret, use Payment Element
      if (sessionResult.data?.clientSecret) {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw submitError;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: sessionResult.data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/payment/success`,
          },
        });

        if (confirmError) {
          throw confirmError;
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          setMessage('Fizetés sikeres!');
          setMessageType('success');
          onSuccess?.(paymentIntent);
        }
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setMessage(error.message || 'Váratlan hiba történt a fizetés során');
      setMessageType('error');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Rendelés összegzése</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">{description}</h3>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {mode === 'subscription' ? 'Havi díj' : 'Egyszeri fizetés'}
              </span>
              <span className="font-semibold text-lg">
                {formatCurrency(amount, currency)}
              </span>
            </div>
          </div>

          {features.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Tartalmazza:</h4>
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator />
          
          <div className="flex items-center justify-between font-semibold">
            <span>Összesen</span>
            <span className="text-lg">{formatCurrency(amount, currency)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Fizetési adatok</span>
          </CardTitle>
          <CardDescription>
            Biztonságos fizetés Stripe segítségével
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Element */}
            <div className="space-y-4">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      name: user?.displayName || '',
                      email: user?.email || '',
                    }
                  }
                }}
              />
            </div>

            {/* Address Element for subscriptions */}
            {mode === 'subscription' && (
              <div className="space-y-2">
                <h4 className="font-medium">Számlázási cím</h4>
                <AddressElement
                  options={{
                    mode: 'billing',
                    defaultValues: {
                      name: user?.displayName || '',
                    }
                  }}
                />
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>SSL titkosítás</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>PCI DSS megfelelő</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>Stripe által védett</span>
              </div>
            </div>

            {/* Error/Success Message */}
            {message && (
              <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
                {messageType === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !elements || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {mode === 'subscription' 
                    ? `Beiratkozás előfizetéssel - ${formatCurrency(amount, currency)}/hó`
                    : `Beiratkozás - ${formatCurrency(amount, currency)}`
                  }
                </>
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              A beiratkozás gombra kattintva elfogadja az{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Általános Szerződési Feltételeket
              </a>{' '}
              és az{' '}
              <a href="/privacy" className="underline hover:text-foreground">
                Adatvédelmi Szabályzatot
              </a>
              .
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <div>
                <p className="font-medium">30 napos pénz-visszafizetési garancia</p>
                <p>Ha nem elégedett, teljes összeget visszatérítjük.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Biztonságos fizetés</p>
                <p>Adatai SSL titkosítással védettek, nem tároljuk bankkártya adatait.</p>
              </div>
            </div>

            {mode === 'subscription' && (
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-orange-600" />
                <div>
                  <p className="font-medium">Előfizetés kezelése</p>
                  <p>Bármikor lemondhatja vagy módosíthatja előfizetését a fiókjában.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component that wraps with Elements provider
export function CheckoutForm(props: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const options = {
    mode: props.mode,
    amount: props.amount,
    currency: props.currency.toLowerCase(),
    ...stripeElementsOptions,
    ...(clientSecret && { clientSecret }),
  };

  return (
    <Elements stripe={getStripe()} options={options}>
      <CheckoutFormInner {...props} />
    </Elements>
  );
}

export default CheckoutForm;