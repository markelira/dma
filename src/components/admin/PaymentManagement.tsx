'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  RefreshCw,
  Download,
  AlertTriangle,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentManagementProps {
  className?: string;
}

export function PaymentManagement({ className }: PaymentManagementProps) {
  const {
    getPaymentAnalytics,
    getFilteredPaymentHistory,
    createRefund,
    paymentHistory,
    paymentHistoryLoading,
    getPaymentSummary,
    isLoadingAnalytics,
    isCreatingRefund,
    isFilteringHistory
  } = usePaymentActions();

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; payment?: any }>({ open: false });
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const paymentSummary = getPaymentSummary();

  const formatCurrency = (amount: number, currency = 'HUF') => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Sikeres</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Folyamatban</Badge>;
      case 'failed':
        return <Badge variant="destructive">Sikertelen</Badge>;
      case 'refunded':
        return <Badge variant="outline">Visszatérített</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleLoadAnalytics = async () => {
    try {
      const data = await getPaymentAnalytics.mutateAsync({
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleFilterPayments = async () => {
    try {
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (dateRange.start) {
        filters.startDate = dateRange.start;
      }
      
      if (dateRange.end) {
        filters.endDate = dateRange.end;
      }

      const data = await getFilteredPaymentHistory.mutateAsync(filters);
      
      let filtered = data.payments;
      
      // Apply search filter on client side
      if (searchTerm) {
        filtered = filtered.filter(payment => 
          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setFilteredPayments(filtered);
    } catch (error) {
      console.error('Failed to filter payments:', error);
    }
  };

  const handleRefund = async () => {
    if (!refundDialog.payment) return;

    try {
      const refundData: any = {
        paymentId: refundDialog.payment.id,
        reason: refundReason
      };
      
      if (refundAmount) {
        refundData.amount = parseFloat(refundAmount);
      }

      await createRefund.mutateAsync(refundData);
      setRefundDialog({ open: false });
      setRefundReason('');
      setRefundAmount('');
      
      // Refresh filtered payments
      handleFilterPayments();
    } catch (error) {
      console.error('Failed to create refund:', error);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fizetések kezelése</h1>
            <p className="text-muted-foreground">
              Fizetési tranzakciók, visszatérítések és analitika
            </p>
          </div>
          
          <Button onClick={handleLoadAnalytics} disabled={isLoadingAnalytics}>
            {isLoadingAnalytics ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Analitika betöltése
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="payments">Fizetések</TabsTrigger>
            <TabsTrigger value="analytics">Analitika</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Összes bevétel</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(paymentSummary.totalPaid)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentSummary.completedCount} sikeres tranzakció
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visszatérítések</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(paymentSummary.totalRefunded)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentSummary.refundedCount} visszatérítés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sikertelen fizetések</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{paymentSummary.failedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Beavatkozást igénylő
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Folyamatban</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{paymentSummary.pendingCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Függőben lévő
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Legutóbbi fizetések</CardTitle>
                <CardDescription>
                  A legutóbbi 10 fizetési tranzakció
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistoryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.slice(0, 10).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(payment.status)}
                          <span className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Szűrők</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Keresés</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Leírás vagy ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Státusz</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Minden státusz</SelectItem>
                        <SelectItem value="completed">Sikeres</SelectItem>
                        <SelectItem value="pending">Folyamatban</SelectItem>
                        <SelectItem value="failed">Sikertelen</SelectItem>
                        <SelectItem value="refunded">Visszatérített</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Kezdő dátum</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Záró dátum</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Button onClick={handleFilterPayments} disabled={isFilteringHistory}>
                  {isFilteringHistory ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="w-4 h-4 mr-2" />
                  )}
                  Szűrés alkalmazása
                </Button>
              </CardContent>
            </Card>

            {/* Filtered Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Fizetési tranzakciók</CardTitle>
                <CardDescription>
                  {filteredPayments.length > 0 
                    ? `${filteredPayments.length} szűrt eredmény`
                    : 'Használja a szűrőket a fizetések megjelenítéséhez'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nincs megjeleníthető fizetés</p>
                    <p className="text-sm">Használja a szűrőket a kereséshez</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{payment.description}</h4>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>ID: {payment.id}</p>
                            <p>Dátum: {formatDate(payment.createdAt)}</p>
                            {payment.failureReason && (
                              <p className="text-red-600">Hiba: {payment.failureReason}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                          
                          {payment.status === 'completed' && (
                            <Dialog 
                              open={refundDialog.open && refundDialog.payment?.id === payment.id}
                              onOpenChange={(open) => setRefundDialog({ 
                                open, 
                                payment: open ? payment : undefined 
                              })}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Visszatérítés
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Visszatérítés létrehozása</DialogTitle>
                                  <DialogDescription>
                                    Visszatérítés a következő fizetéshez: {payment.description}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Visszatérítendő összeg (opcionális)</Label>
                                    <Input
                                      type="number"
                                      placeholder={`Maximum: ${payment.amount / 100}`}
                                      value={refundAmount}
                                      onChange={(e) => setRefundAmount(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Hagyja üresen a teljes összeg visszatérítéséhez
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Indoklás</Label>
                                    <Textarea
                                      placeholder="Visszatérítés indoklása..."
                                      value={refundReason}
                                      onChange={(e) => setRefundReason(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setRefundDialog({ open: false })}
                                  >
                                    Mégse
                                  </Button>
                                  <Button 
                                    onClick={handleRefund}
                                    disabled={isCreatingRefund}
                                  >
                                    {isCreatingRefund ? (
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    Visszatérítés
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analyticsData ? (
              <div className="space-y-6">
                {/* Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Összes bevétel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analyticsData.revenue.total, analyticsData.revenue.currency)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Konverziós arány</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsData.transactions.conversionRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analyticsData.transactions.successful} / {analyticsData.transactions.total}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Új előfizetések</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsData.subscriptions.new}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Period Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Időszak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {formatDate(analyticsData.period.start)} - {formatDate(analyticsData.period.end)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Analitika betöltése</p>
                  <p className="text-muted-foreground mb-4">
                    Kattintson az "Analitika betöltése" gombra az adatok megtekintéséhez
                  </p>
                  <Button onClick={handleLoadAnalytics} disabled={isLoadingAnalytics}>
                    {isLoadingAnalytics ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-2" />
                    )}
                    Analitika betöltése
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}