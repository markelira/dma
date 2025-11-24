'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Download,
  Calendar,
  Users,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Wallet
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'subscription';
  studentName: string;
  studentEmail: string;
  courseTitle?: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionDate: Date;
  description?: string;
}

interface FinanceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  averageTransactionValue: number;
  totalRefunds: number;
  growthRate: number;
  topCourse: { title: string; revenue: number } | null;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export default function UniversityAdminFinancePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    averageTransactionValue: 0,
    totalRefunds: 0,
    growthRate: 0,
    topCourse: null,
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user?.universityId) return;

    // Load financial data for this university
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('universityId', '==', user.universityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(paymentsQuery, 
      async (snapshot) => {
        const transactionsData: Transaction[] = [];
        const courseRevenue = new Map<string, { title: string; revenue: number }>();
        const monthlyRevenue = new Map<string, number>();
        
        let totalRevenue = 0;
        let currentMonthRevenue = 0;
        let currentYearRevenue = 0;
        let lastMonthRevenue = 0;
        let totalRefunds = 0;
        let pendingCount = 0;
        let completedCount = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          const transactionDate = data.createdAt?.toDate() || new Date();
          const transMonth = transactionDate.getMonth();
          const transYear = transactionDate.getFullYear();
          
          // Calculate revenue by time period
          if (data.status === 'completed') {
            totalRevenue += data.amount || 0;
            completedCount++;

            if (transYear === currentYear && transMonth === currentMonth) {
              currentMonthRevenue += data.amount || 0;
            }
            if (transYear === currentYear) {
              currentYearRevenue += data.amount || 0;
            }
            if (transYear === lastMonthYear && transMonth === lastMonth) {
              lastMonthRevenue += data.amount || 0;
            }

            // Track revenue by course
            if (data.courseId && data.courseTitle) {
              const existing = courseRevenue.get(data.courseId) || { title: data.courseTitle, revenue: 0 };
              existing.revenue += data.amount || 0;
              courseRevenue.set(data.courseId, existing);
            }

            // Track monthly revenue
            const monthKey = `${transYear}-${String(transMonth + 1).padStart(2, '0')}`;
            const existingMonthRevenue = monthlyRevenue.get(monthKey) || 0;
            monthlyRevenue.set(monthKey, existingMonthRevenue + (data.amount || 0));
          } else if (data.status === 'refunded') {
            totalRefunds += data.amount || 0;
          } else if (data.status === 'pending') {
            pendingCount++;
          }

          transactionsData.push({
            id: docSnapshot.id,
            type: data.type || 'payment',
            studentName: data.studentName || 'Unknown',
            studentEmail: data.studentEmail || '',
            courseTitle: data.courseTitle,
            amount: data.amount || 0,
            status: data.status || 'pending',
            paymentMethod: data.paymentMethod || 'card',
            transactionDate,
            description: data.description
          });
        }

        // Calculate growth rate
        const growthRate = lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        // Find top course by revenue
        let topCourse: { title: string; revenue: number } | null = null;
        courseRevenue.forEach(course => {
          if (!topCourse || course.revenue > topCourse.revenue) {
            topCourse = course;
          }
        });

        // Prepare monthly revenue data for chart
        const sortedMonths = Array.from(monthlyRevenue.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-12)
          .map(([month, revenue]) => ({
            month: new Date(month + '-01').toLocaleDateString('hu-HU', { month: 'short', year: '2-digit' }),
            revenue
          }));

        setStats({
          totalRevenue,
          monthlyRevenue: currentMonthRevenue,
          yearlyRevenue: currentYearRevenue,
          pendingPayments: pendingCount,
          completedPayments: completedCount,
          averageTransactionValue: completedCount > 0 ? totalRevenue / completedCount : 0,
          totalRefunds,
          growthRate,
          topCourse,
          revenueByMonth: sortedMonths
        });

        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error loading financial data:', error);
        // Ha nincs még index, akkor üres listával dolgozunk
        if (error.code === 'failed-precondition') {
          console.log('Firestore index required for this query');
        }
        setTransactions([]);
        setFilteredTransactions([]);
        setStats({
          totalRevenue: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          pendingPayments: 0,
          completedPayments: 0,
          averageTransactionValue: 0,
          totalRefunds: 0,
          growthRate: 0,
          topCourse: null,
          revenueByMonth: []
        });
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user?.universityId]);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Apply period filter
    const now = new Date();
    if (periodFilter === 'today') {
      filtered = filtered.filter(t => {
        const date = new Date(t.transactionDate);
        return date.toDateString() === now.toDateString();
      });
    } else if (periodFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.transactionDate) >= weekAgo);
    } else if (periodFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.transactionDate) >= monthAgo);
    } else if (periodFilter === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.transactionDate) >= yearAgo);
    }

    setFilteredTransactions(filtered);
  }, [statusFilter, periodFilter, transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Teljesített</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Függőben</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Sikertelen</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Visszatérített</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const exportFinancialReport = () => {
    const headers = ['Dátum', 'Hallgató', 'Email', 'Tartalom', 'Összeg', 'Státusz', 'Fizetési mód'];
    const rows = filteredTransactions.map(t => [
      new Date(t.transactionDate).toLocaleDateString('hu-HU'),
      t.studentName,
      t.studentEmail,
      t.courseTitle || 'N/A',
      `${t.amount.toLocaleString()} Ft`,
      t.status,
      t.paymentMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `penzugyi_jelentes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pénzügyek</h1>
          <p className="text-muted-foreground">
            Az egyetem pénzügyi adatainak áttekintése és kezelése
          </p>
        </div>
        <Button onClick={exportFinancialReport} className="gap-2">
          <Download className="h-4 w-4" />
          Jelentés exportálása
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teljes bevétel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} Ft</div>
            <p className="text-xs text-muted-foreground">Összesen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Havi bevétel</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} Ft</div>
            <div className="flex items-center pt-1">
              {stats.growthRate > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+{stats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">{stats.growthRate.toFixed(1)}%</span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">vs előző hónap</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Éves bevétel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.yearlyRevenue.toLocaleString()} Ft</div>
            <p className="text-xs text-muted-foreground">{new Date().getFullYear()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlag tranzakció</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageTransactionValue).toLocaleString()} Ft</div>
            <p className="text-xs text-muted-foreground">Per fizetés</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teljesített fizetések</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">Sikeres tranzakciók</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Függőben lévő</CardTitle>
            <Receipt className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Feldolgozás alatt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visszatérítések</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalRefunds.toLocaleString()} Ft</div>
            <p className="text-xs text-muted-foreground">Összes visszatérítés</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Course */}
      {stats.topCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Legnépszerűbb tartalom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{stats.topCourse.title}</p>
                <p className="text-sm text-muted-foreground">Legtöbb bevételt hozó tartalom</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {stats.topCourse.revenue.toLocaleString()} Ft
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Időszak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Ma</SelectItem>
                <SelectItem value="week">Elmúlt 7 nap</SelectItem>
                <SelectItem value="month">Elmúlt 30 nap</SelectItem>
                <SelectItem value="year">Elmúlt év</SelectItem>
                <SelectItem value="all">Minden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Státusz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden státusz</SelectItem>
                <SelectItem value="completed">Teljesített</SelectItem>
                <SelectItem value="pending">Függőben</SelectItem>
                <SelectItem value="failed">Sikertelen</SelectItem>
                <SelectItem value="refunded">Visszatérített</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tranzakciók</CardTitle>
          <CardDescription>Az összes pénzügyi tranzakció listája</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dátum</TableHead>
                <TableHead>Hallgató</TableHead>
                <TableHead>Tartalom</TableHead>
                <TableHead>Összeg</TableHead>
                <TableHead>Fizetési mód</TableHead>
                <TableHead>Státusz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(transaction.transactionDate).toLocaleDateString('hu-HU')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.studentName}</div>
                      <div className="text-sm text-muted-foreground">{transaction.studentEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.courseTitle || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {transaction.amount.toLocaleString()} Ft
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {transaction.paymentMethod}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}