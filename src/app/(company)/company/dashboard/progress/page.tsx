'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Download,
  Mail
} from 'lucide-react';
import { DashboardStats, EmployeeProgress, CompanyDashboardData } from '@/types/company';

export default function CompanyProgressDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [masterclasses, setMasterclasses] = useState<{ id: string; title: string; duration: number }[]>([]);
  const [selectedMasterclass, setSelectedMasterclass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyName, setCompanyName] = useState<string>('');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/company/dashboard/progress');
      return;
    }

    if (user?.companyId) {
      loadDashboard();
    }
  }, [user, authLoading, selectedMasterclass]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const getDashboard = httpsCallable(functions, 'getCompanyDashboard');

      const input: any = { companyId: user!.companyId };
      if (selectedMasterclass !== 'all') {
        input.masterclassId = selectedMasterclass;
      }

      const result = await getDashboard(input);
      const data = result.data as CompanyDashboardData;

      setCompanyName(data.companyName);
      setStats(data.stats);
      setEmployees(data.employees.map((emp: any) => ({
        ...emp,
        lastActivityAt: emp.lastActivityAt ? new Date(emp.lastActivityAt) : undefined,
        enrolledAt: new Date(emp.enrolledAt),
      })));
      setMasterclasses(data.masterclasses);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    try {
      const generateCSV = httpsCallable(functions, 'generateCSVReport');

      const input: any = { companyId: user!.companyId };
      if (selectedMasterclass !== 'all') {
        input.masterclassId = selectedMasterclass;
      }

      const result = await generateCSV(input);
      const data = result.data as any;

      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      alert('Hiba történt az export során: ' + (err.message || 'Ismeretlen hiba'));
    }
  }

  async function handleSendReminder(employeeId: string, masterclassId?: string) {
    const key = `${employeeId}-${masterclassId || 'all'}`;
    try {
      setSendingReminder(key);
      const sendReminder = httpsCallable(functions, 'sendEmployeeReminder');

      const result = await sendReminder({
        companyId: user!.companyId,
        employeeId,
        masterclassId,
      });

      const data = result.data as any;
      if (data.success) {
        alert('✓ ' + data.message);
      }
    } catch (err: any) {
      console.error('Error sending reminder:', err);
      alert('Hiba történt az emlékeztető küldése során: ' + (err.message || 'Ismeretlen hiba'));
    } finally {
      setSendingReminder(null);
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === 'all') return true;
    return emp.status === statusFilter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Hiba</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/company/dashboard')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Vissza
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/company/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Haladás Követés</h1>
                <p className="text-sm text-gray-600">{companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm font-medium">Összes Alkalmazott</div>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm font-medium">Aktív</div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">{stats.activeEmployees}</div>
              <div className="text-xs text-gray-500 mt-1">Utolsó 7 napban</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm font-medium">Lemaradásban</div>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-900">{stats.atRiskCount}</div>
              <div className="text-xs text-gray-500 mt-1">&gt;7 nap inaktív</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm font-medium">Befejezések</div>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-900">{stats.completedCourses}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm font-medium">Átlagos Haladás</div>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">{stats.averageProgress}%</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Szűrők:</span>
            </div>

            <select
              value={selectedMasterclass}
              onChange={(e) => setSelectedMasterclass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Minden képzés</option>
              {masterclasses.map((mc) => (
                <option key={mc.id} value={mc.id}>
                  {mc.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Minden státusz</option>
              <option value="active">Aktív</option>
              <option value="at-risk">Lemaradásban</option>
              <option value="completed">Befejezett</option>
              <option value="not-started">Nem kezdett</option>
            </select>

            <div className="ml-auto">
              <button
                onClick={handleExportCSV}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Employee Progress Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Alkalmazotti Haladás ({filteredEmployees.length})
            </h2>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nincs találat
              </h3>
              <p className="text-gray-600">
                Próbálj más szűrőket használni
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alkalmazott
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Képzés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Haladás
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leckék
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Státusz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utolsó Aktivitás
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((emp) => (
                    <tr key={`${emp.employeeId}-${emp.masterclassId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {emp.employeeName}
                          </div>
                          <div className="text-xs text-gray-500">{emp.email}</div>
                          {emp.jobTitle && (
                            <div className="text-xs text-gray-400">{emp.jobTitle}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{emp.masterclassTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  emp.progressPercent === 100
                                    ? 'bg-green-600'
                                    : emp.status === 'at-risk'
                                    ? 'bg-red-600'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${emp.progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                            {emp.progressPercent}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {emp.completedLessons} / {emp.totalLessons}
                        </div>
                        <div className="text-xs text-gray-500">Lecke {emp.currentLesson} / {emp.totalLessons}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.status === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Befejezve
                          </span>
                        ) : emp.status === 'at-risk' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Lemaradásban
                          </span>
                        ) : emp.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Aktív
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Nem kezdett
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {emp.lastActivityAt
                          ? new Date(emp.lastActivityAt).toLocaleDateString('hu-HU')
                          : 'Nincs'}
                        {emp.daysActive > 0 && (
                          <div className="text-xs text-gray-400">{emp.daysActive} napja</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {emp.status === 'at-risk' && (
                          <button
                            onClick={() => handleSendReminder(emp.employeeId, emp.masterclassId)}
                            disabled={sendingReminder === `${emp.employeeId}-${emp.masterclassId}`}
                            className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            {sendingReminder === `${emp.employeeId}-${emp.masterclassId}` ? 'Küldés...' : 'Emlékeztető'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
