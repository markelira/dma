import { useAuth } from './useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Cloud Function callable references
const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession');
const getPaymentHistoryFn = httpsCallable(functions, 'getPaymentHistory');
const createRefundFn = httpsCallable(functions, 'createRefund');
const getSubscriptionStatusFn = httpsCallable(functions, 'getSubscriptionStatus');
const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
const getPaymentAnalyticsFn = httpsCallable(functions, 'getPaymentAnalytics');
const retryFailedPaymentFn = httpsCallable(functions, 'retryFailedPayment');

// Types for enhanced payment actions
export interface CheckoutSessionData {
  courseId?: string;
  priceId?: string;
  mode?: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentHistoryFilter {
  limit?: number;
  status?: 'completed' | 'pending' | 'failed' | 'refunded';
  startDate?: string;
  endDate?: string;
}

export interface RefundData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  courseId?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  paymentIntentId: string;
  sessionId?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive: boolean;
  subscription?: {
    id: string;
    subscriptionId: string;
    status: string;
    planName: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
  };
}

export interface PaymentAnalytics {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    total: number;
    currency: string;
  };
  transactions: {
    total: number;
    successful: number;
    conversionRate: number;
  };
  subscriptions: {
    new: number;
  };
}

export function usePaymentActions() {
  const { user } = useAuth();

  // Create checkout session mutation
  const createCheckoutSession = useMutation({
    mutationFn: async (data: CheckoutSessionData) => {
      const result = await createCheckoutSessionFn(data);
      return result.data as { 
        success: boolean; 
        sessionId?: string; 
        url?: string; 
        error?: string;
        details?: any[];
      };
    },
    onSuccess: (result) => {
      if (result.success && result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      }
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
    }
  });

  // Get payment history query
  const {
    data: paymentHistoryData,
    isLoading: paymentHistoryLoading,
    error: paymentHistoryError,
    refetch: refetchPaymentHistory
  } = useQuery({
    queryKey: ['paymentHistory', user?.uid],
    queryFn: async () => {
      const result = await getPaymentHistoryFn();
      const data = result.data as { 
        success: boolean; 
        payments?: PaymentRecord[]; 
        total?: number;
        error?: string 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }
      
      return {
        payments: data.payments || [],
        total: data.total || 0
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get filtered payment history
  const getFilteredPaymentHistory = useMutation({
    mutationFn: async (filters: PaymentHistoryFilter) => {
      const result = await getPaymentHistoryFn(filters);
      const data = result.data as { 
        success: boolean; 
        payments?: PaymentRecord[]; 
        total?: number;
        error?: string 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }
      
      return {
        payments: data.payments || [],
        total: data.total || 0
      };
    }
  });

  // Create refund mutation (admin only)
  const createRefund = useMutation({
    mutationFn: async (data: RefundData) => {
      const result = await createRefundFn(data);
      return result.data as { 
        success: boolean; 
        refundId?: string; 
        amount?: number;
        currency?: string;
        error?: string;
        details?: any[];
      };
    },
    onSuccess: () => {
      // Refetch payment history to show updated status
      refetchPaymentHistory();
    }
  });

  // Get subscription status query
  const {
    data: subscriptionStatusData,
    isLoading: subscriptionStatusLoading,
    error: subscriptionStatusError,
    refetch: refetchSubscriptionStatus
  } = useQuery({
    queryKey: ['subscriptionStatus', user?.uid],
    queryFn: async () => {
      const result = await getSubscriptionStatusFn();
      const data = result.data as SubscriptionStatus & { 
        success: boolean; 
        error?: string 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subscription status');
      }
      
      return {
        hasSubscription: data.hasSubscription,
        isActive: data.isActive,
        subscription: data.subscription
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const result = await cancelSubscriptionFn();
      return result.data as { 
        success: boolean; 
        message?: string;
        cancelAt?: string;
        error?: string 
      };
    },
    onSuccess: () => {
      // Refetch subscription status to show updated state
      refetchSubscriptionStatus();
    }
  });

  // Get payment analytics query (admin only)
  const getPaymentAnalytics = useMutation({
    mutationFn: async (dateRange?: { startDate?: string; endDate?: string }) => {
      const result = await getPaymentAnalyticsFn(dateRange);
      const data = result.data as { 
        success: boolean; 
        analytics?: PaymentAnalytics;
        error?: string 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment analytics');
      }
      
      return data.analytics!;
    }
  });

  // Retry failed payment mutation
  const retryFailedPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const result = await retryFailedPaymentFn({ paymentId });
      return result.data as { 
        success: boolean; 
        sessionId?: string; 
        url?: string; 
        error?: string 
      };
    },
    onSuccess: (result) => {
      if (result.success && result.url) {
        // Redirect to new checkout session
        window.location.href = result.url;
      }
    }
  });

  // Helper function to create course checkout
  const purchaseCourse = async (
    courseId: string, 
    successUrl?: string, 
    cancelUrl?: string,
    metadata?: Record<string, string>
  ) => {
    const currentUrl = window.location.origin;
    
    return createCheckoutSession.mutateAsync({
      courseId,
      mode: 'payment',
      successUrl: successUrl || `${currentUrl}/courses/${courseId}/learn?success=true`,
      cancelUrl: cancelUrl || `${currentUrl}/courses/${courseId}?cancelled=true`,
      metadata: {
        courseId,
        purchaseType: 'course',
        ...metadata
      }
    });
  };

  // Helper function to create subscription checkout
  const subscribeToPlan = async (
    priceId: string, 
    successUrl?: string, 
    cancelUrl?: string,
    metadata?: Record<string, string>
  ) => {
    const currentUrl = window.location.origin;
    
    return createCheckoutSession.mutateAsync({
      priceId,
      mode: 'subscription',
      successUrl: successUrl || `${currentUrl}/dashboard?subscription=success`,
      cancelUrl: cancelUrl || `${currentUrl}/subscribe?cancelled=true`,
      metadata: {
        priceId,
        purchaseType: 'subscription',
        ...metadata
      }
    });
  };

  // Helper function to cancel subscription with confirmation
  const cancelSubscriptionWithConfirmation = async (subscriptionName?: string) => {
    const planName = subscriptionName || 'előfizetés';
    const confirmed = window.confirm(
      `Biztos benne, hogy lemondja a(z) ${planName}t? A lemondás a jelenlegi számlázási időszak végén lép életbe.`
    );
    
    if (confirmed) {
      return cancelSubscription.mutateAsync();
    }
  };

  // Helper function to get payment status summary
  const getPaymentSummary = () => {
    const payments = paymentHistoryData?.payments || [];
    
    const summary = {
      totalPaid: 0,
      totalRefunded: 0,
      completedCount: 0,
      failedCount: 0,
      pendingCount: 0,
      refundedCount: 0
    };

    payments.forEach(payment => {
      switch (payment.status) {
        case 'completed':
          summary.totalPaid += payment.amount;
          summary.completedCount++;
          break;
        case 'failed':
          summary.failedCount++;
          break;
        case 'pending':
          summary.pendingCount++;
          break;
        case 'refunded':
          summary.totalRefunded += payment.refundAmount || payment.amount;
          summary.refundedCount++;
          break;
      }
    });

    return summary;
  };

  return {
    // Mutations
    createCheckoutSession,
    createRefund,
    cancelSubscription,
    getFilteredPaymentHistory,
    getPaymentAnalytics,
    retryFailedPayment,
    
    // Queries
    paymentHistory: paymentHistoryData?.payments || [],
    paymentHistoryTotal: paymentHistoryData?.total || 0,
    paymentHistoryLoading,
    paymentHistoryError,
    refetchPaymentHistory,
    
    subscriptionStatus: subscriptionStatusData,
    subscriptionStatusLoading,
    subscriptionStatusError,
    refetchSubscriptionStatus,
    
    // Helper functions
    purchaseCourse,
    subscribeToPlan,
    cancelSubscriptionWithConfirmation,
    getPaymentSummary,
    
    // Loading states
    isCreatingCheckout: createCheckoutSession.isPending,
    isCreatingRefund: createRefund.isPending,
    isCancellingSubscription: cancelSubscription.isPending,
    isRetryingPayment: retryFailedPayment.isPending,
    isLoadingAnalytics: getPaymentAnalytics.isPending,
    isFilteringHistory: getFilteredPaymentHistory.isPending
  };
}