import { useAuth } from './useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Cloud Function callable references - using both stripe.ts and paymentActions.ts functions
const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession'); // From paymentActions.ts
const createCustomerFn = httpsCallable(functions, 'createCustomer'); // From stripe.ts
const createSubscriptionFn = httpsCallable(functions, 'createSubscription'); // From stripe.ts
const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription'); // From paymentActions.ts
const getPaymentMethodsFn = httpsCallable(functions, 'getPaymentMethods'); // From stripe.ts
const createSetupIntentFn = httpsCallable(functions, 'createSetupIntent'); // From stripe.ts
const getUserSubscriptionsFn = httpsCallable(functions, 'getUserSubscriptions'); // From stripe.ts
const getSubscriptionStatusFn = httpsCallable(functions, 'getSubscriptionStatus'); // From paymentActions.ts

// Types
export interface CheckoutSessionData {
  courseId?: string;
  priceId?: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CustomerData {
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface SubscriptionData {
  priceId: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  items: Array<{
    id: string;
    priceId: string;
    productId: string;
    amount: number;
    currency: string;
    interval?: string;
  }>;
}

export function useStripe() {
  const { user } = useAuth();

  // Create checkout session mutation
  const createCheckoutSession = useMutation({
    mutationFn: async (data: CheckoutSessionData) => {
      console.log('🟢 [useStripe] mutationFn called with data:', data);

      const result = await createCheckoutSessionFn(data);

      console.log('🟢 [useStripe] Cloud Function raw result:', result);
      console.log('🟢 [useStripe] result.data:', result.data);

      const typedResult = result.data as { success: boolean; data?: { sessionId: string; url: string }; error?: string };

      console.log('🟢 [useStripe] Typed result:', typedResult);
      console.log('🟢 [useStripe] typedResult.success:', typedResult.success);
      console.log('🟢 [useStripe] typedResult.data:', typedResult.data);
      console.log('🟢 [useStripe] typedResult.data?.url:', typedResult.data?.url);

      return typedResult;
    },
    onSuccess: (result) => {
      console.log('🟢 [useStripe] onSuccess called with result:', result);
      console.log('🟢 [useStripe] Checking redirect condition:', {
        success: result.success,
        hasData: !!result.data,
        hasUrl: !!result.data?.url,
        url: result.data?.url
      });

      if (result.success && result.data?.url) {
        console.log('🟢 [useStripe] Redirecting to:', result.data.url);
        window.location.href = result.data.url;
      } else {
        console.warn('⚠️ [useStripe] Redirect condition not met!', {
          success: result.success,
          data: result.data
        });
      }
    },
    onError: (error) => {
      console.error('❌ [useStripe] onError called:', error);
    }
  });

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: async (data: CustomerData) => {
      const result = await createCustomerFn(data);
      return result.data as { success: boolean; data?: { customerId: string }; error?: string };
    }
  });

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (data: SubscriptionData) => {
      const result = await createSubscriptionFn(data);
      return result.data as { 
        success: boolean; 
        data?: { 
          subscriptionId: string; 
          status: string; 
          clientSecret?: string;
        }; 
        error?: string 
      };
    }
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const result = await cancelSubscriptionFn({ subscriptionId });
      return result.data as { 
        success: boolean; 
        data?: { 
          subscriptionId: string; 
          status: string;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
        }; 
        error?: string 
      };
    }
  });

  // Create setup intent mutation
  const createSetupIntent = useMutation({
    mutationFn: async () => {
      const result = await createSetupIntentFn();
      return result.data as { 
        success: boolean; 
        data?: { 
          setupIntentId: string; 
          clientSecret: string;
        }; 
        error?: string 
      };
    }
  });

  // Get payment methods query
  const {
    data: paymentMethodsData,
    isLoading: paymentMethodsLoading,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods
  } = useQuery({
    queryKey: ['paymentMethods', user?.uid],
    queryFn: async () => {
      const result = await getPaymentMethodsFn();
      const data = result.data as { 
        success: boolean; 
        data?: { paymentMethods: PaymentMethod[] }; 
        error?: string 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }
      
      return data.data?.paymentMethods || [];
    },
    enabled: false, // Disabled - Cloud Function not implemented
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user subscriptions query
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions
  } = useQuery({
    queryKey: ['subscriptions', user?.uid],
    queryFn: async () => {
      const result = await getUserSubscriptionsFn();
      const data = result.data as {
        success: boolean;
        data?: { subscriptions: Subscription[] };
        error?: string
      };

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subscriptions');
      }

      return data.data?.subscriptions || [];
    },
    enabled: false, // Disabled - Cloud Function not implemented
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function to purchase a course
  const purchaseCourse = async (courseId: string, successUrl?: string, cancelUrl?: string) => {
    const currentUrl = window.location.origin;
    
    return createCheckoutSession.mutateAsync({
      courseId,
      mode: 'payment',
      successUrl: successUrl || `${currentUrl}/courses/${courseId}/learn?success=true`,
      cancelUrl: cancelUrl || `${currentUrl}/courses/${courseId}?cancelled=true`
    });
  };

  // Helper function to subscribe to a plan
  const subscribeToPlan = async (priceId: string, successUrl?: string, cancelUrl?: string) => {
    const currentUrl = window.location.origin;
    
    return createCheckoutSession.mutateAsync({
      priceId,
      mode: 'subscription',
      successUrl: successUrl || `${currentUrl}/dashboard?subscription=success`,
      cancelUrl: cancelUrl || `${currentUrl}/subscribe?cancelled=true`
    });
  };

  // Helper function to cancel subscription with confirmation
  const cancelSubscriptionWithConfirmation = async (subscriptionId: string) => {
    const confirmed = window.confirm(
      'Biztos benne, hogy lemondja az előfizetését? A jelenlegi számlázási időszak végéig továbbra is hozzáférhet a tartalmakhoz.'
    );
    
    if (confirmed) {
      return cancelSubscription.mutateAsync(subscriptionId);
    }
  };

  return {
    // Mutations
    createCheckoutSession,
    createCustomer,
    createSubscription,
    cancelSubscription,
    createSetupIntent,
    
    // Queries
    paymentMethods: paymentMethodsData || [],
    paymentMethodsLoading,
    paymentMethodsError,
    refetchPaymentMethods,
    
    subscriptions: subscriptionsData || [],
    subscriptionsLoading,
    subscriptionsError,
    refetchSubscriptions,
    
    // Helper functions
    purchaseCourse,
    subscribeToPlan,
    cancelSubscriptionWithConfirmation,
    
    // Loading states
    isCreatingCheckout: createCheckoutSession.isPending,
    isCreatingCustomer: createCustomer.isPending,
    isCreatingSubscription: createSubscription.isPending,
    isCancellingSubscription: cancelSubscription.isPending,
    isCreatingSetupIntent: createSetupIntent.isPending,
  };
}