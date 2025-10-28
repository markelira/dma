import { loadStripe, Stripe } from '@stripe/stripe-js';

// Singleton pattern for Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key is not configured');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Configuration for Stripe Elements
export const stripeElementsOptions = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0F172A',
      colorBackground: '#ffffff',
      colorText: '#0F172A',
      colorDanger: '#ef4444',
      colorSuccess: '#22c55e',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
      fontSizeBase: '14px',
      fontWeightNormal: '400',
      fontWeightBold: '600',
    },
    rules: {
      '.Tab': {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        padding: '12px',
      },
      '.Tab:hover': {
        borderColor: '#cbd5e1',
      },
      '.Tab--selected': {
        borderColor: '#0F172A',
        boxShadow: '0 0 0 1px #0F172A',
      },
      '.Input': {
        borderRadius: '6px',
        fontSize: '14px',
        padding: '12px',
      },
      '.Input:focus': {
        borderColor: '#0F172A',
        boxShadow: '0 0 0 1px #0F172A',
      },
      '.Label': {
        fontWeight: '500',
        fontSize: '14px',
        marginBottom: '6px',
      },
    },
  },
};

// Hungarian localization for Stripe Elements
export const stripeLocale = 'hu' as const;

// Helper function to format currency for Hungarian locale
export const formatHungarianCurrency = (amount: number, currency = 'HUF'): string => {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: currency.toUpperCase() === 'HUF' ? 0 : 2,
  }).format(amount / 100);
};

// Helper function to format date for Hungarian locale
export const formatHungarianDate = (date: string | number | Date): string => {
  return new Date(date).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Stripe payment method types commonly used in Hungary
export const supportedPaymentMethods = [
  'card',
  'sepa_debit',
  'bancontact',
  'eps',
  'giropay',
  'ideal',
  'p24',
  'sofort',
] as const;

// Configuration for different payment flows
export const paymentFlowConfig = {
  course: {
    mode: 'payment' as const,
    allowedCountries: ['HU', 'AT', 'DE', 'SK', 'CZ', 'RO', 'SI', 'HR'],
    currency: 'HUF',
    automaticTax: true,
  },
  subscription: {
    mode: 'subscription' as const,
    allowedCountries: ['HU', 'AT', 'DE', 'SK', 'CZ', 'RO', 'SI', 'HR'],
    currency: 'HUF',
    automaticTax: true,
    collectionMethod: 'charge_automatically' as const,
  },
} as const;

export default getStripe;