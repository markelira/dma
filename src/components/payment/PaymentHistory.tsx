'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Receipt, 
  Download, 
  Search, 
  Calendar,
  CreditCard,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  courseTitle?: string;
  courseId?: string;
  invoiceNumber: string;
  paymentMethod: {
    type: 'card' | 'bank_transfer';
    last4?: string;
    brand?: string;
  };
  receiptUrl?: string;
}

// Mock data for demonstration
const mockPayments: PaymentRecord[] = [
  {
    id: '1',
    date: '2024-01-15T10:30:00Z',
    amount: 15990,
    currency: 'HUF',
    status: 'completed',
    description: 'React fejlesztés kezdőknek kurzus',
    courseTitle: 'React fejlesztés kezdőknek',
    courseId: 'react-basics-2024',
    invoiceNumber: 'INV-2024-001',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'visa'
    },
    receiptUrl: '#'
  },
  {
    id: '2',
    date: '2024-01-10T14:20:00Z',
    amount: 5990,
    currency: 'HUF',
    status: 'completed',
    description: 'Profi előfizetés - január',
    invoiceNumber: 'INV-2024-002',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'mastercard'
    },
    receiptUrl: '#'
  },
  {
    id: '3',
    date: '2024-01-05T09:15:00Z',
    amount: 8990,
    currency: 'HUF',
    status: 'refunded',
    description: 'Python programozás kurzus',
    courseTitle: 'Python programozás kurzus',
    courseId: 'python-intro-2024',
    invoiceNumber: 'INV-2024-003',
    paymentMethod: {
      type: 'card',
      last4: '1234',
      brand: 'visa'
    }
  },
  {
    id: '4',
    date: '2023-12-28T16:45:00Z',
    amount: 12990,
    currency: 'HUF',
    status: 'pending',
    description: 'JavaScript fejlesztés kurzus',
    courseTitle: 'JavaScript fejlesztés kurzus',
    courseId: 'js-advanced-2024',
    invoiceNumber: 'INV-2023-045',
    paymentMethod: {
      type: 'bank_transfer'
    }
  }
];

interface PaymentHistoryProps {
  payments?: PaymentRecord[];
  loading?: boolean;
  className?: string;
}

export function PaymentHistory({ 
  payments = mockPayments,
  loading = false,
  className 
}: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
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
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sikeres
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Folyamatban
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Sikertelen
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <RefreshCw className="w-3 h-3 mr-1" />
            Visszatérített
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodDisplay = (method: PaymentRecord['paymentMethod']) => {
    if (method.type === 'card') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <CreditCard className="w-4 h-4" />
          <span>
            {method.brand?.toUpperCase()} •••• {method.last4}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Calendar className="w-4 h-4" />
        <span>Banki átutalás</span>
      </div>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const paymentDate = new Date(payment.date);
      const now = new Date();
      
      switch (dateRange) {
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesDate = paymentDate >= lastMonth;
          break;
        case 'last_3_months':
          const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          matchesDate = paymentDate >= last3Months;
          break;
        case 'last_year':
          const lastYear = new Date(now.getFullYear() - 1, 0, 1);
          matchesDate = paymentDate >= lastYear;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, '_blank');
    } else {
      // Generate receipt or show message
      alert(`Számla letöltése: ${payment.invoiceNumber}`);
    }
  };

  const handleDownloadAllReceipts = () => {
    const completedPayments = filteredPayments.filter(p => p.status === 'completed');
    alert(`${completedPayments.length} számla letöltése ZIP fájlban...`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Fizetési előzmények</span>
            </CardTitle>
            <CardDescription>
              Korábbi vásárlások és számlák megtekintése
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Letöltési opciók</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadAllReceipts}>
                <Download className="w-4 h-4 mr-2" />
                Összes számla (ZIP)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Receipt className="w-4 h-4 mr-2" />
                Éves összesítő
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Keresés</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Keresés számla vagy kurzus szerint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Státusz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden státusz</SelectItem>
              <SelectItem value="completed">Sikeres</SelectItem>
              <SelectItem value="pending">Folyamatban</SelectItem>
              <SelectItem value="failed">Sikertelen</SelectItem>
              <SelectItem value="refunded">Visszatérített</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Időszak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden időszak</SelectItem>
              <SelectItem value="last_month">Utolsó hónap</SelectItem>
              <SelectItem value="last_3_months">Utolsó 3 hónap</SelectItem>
              <SelectItem value="last_year">Utolsó év</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' || dateRange !== 'all' 
                ? 'Nincs találat a szűrési feltételeknek megfelelően'
                : 'Még nincs fizetési előzmény'
              }
            </p>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all' || dateRange !== 'all'
                ? 'Próbálja meg módosítani a keresési feltételeket'
                : 'A vásárlások után itt jelennek meg a számlák'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredPayments.length} fizetés található
                {payments.length !== filteredPayments.length && ` (${payments.length} összesen)`}
              </span>
              <span>
                Összesen: {formatAmount(
                  filteredPayments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0),
                  'HUF'
                )}
              </span>
            </div>

            {/* Payments list */}
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{payment.description}</h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{formatDate(payment.date)}</span>
                        <span>•</span>
                        <span>{payment.invoiceNumber}</span>
                        <span>•</span>
                        {getPaymentMethodDisplay(payment.paymentMethod)}
                      </div>
                      
                      {payment.courseTitle && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Kurzus: </span>
                          <a 
                            href={`/courses/${payment.courseId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {payment.courseTitle}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-lg font-semibold">
                        {payment.status === 'refunded' && '−'}
                        {formatAmount(payment.amount, payment.currency)}
                      </div>
                      
                      {payment.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Számla
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination could be added here for large datasets */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}