'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Download,
  Mail,
  Loader2,
  Target
} from 'lucide-react';
import { DashboardStats, EmployeeProgress, CompanyDashboardData } from '@/types/company';
import { StatCard } from '@/components/dashboard/StatCard';

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
        alert('Emlékeztető sikeresen elküldve!');
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-white0" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/company/dashboard')}
            className="px-6 py-2 bg-brand-secondary text-white rounded-lg hover:bg-brand-secondary-hover transition-colors"
          >
            Vissza
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Haladás követés</h1>
        <p className="text-gray-500">
          Kövesd nyomon az alkalmazottak tanulási előrehaladását
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Users}
            label="Összes alkalmazott"
            value={stats.totalEmployees}
            isLoading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="Aktív"
            value={stats.activeEmployees}
            isLoading={loading}
          />
          <StatCard
            icon={AlertTriangle}
            label="Lemaradásban"
            value={stats.atRiskCount}
            isLoading={loading}
          />
          <StatCard
            icon={Award}
            label="Befejezések"
            value={stats.completedCourses}
            isLoading={loading}
          />
          <StatCard
            icon={Target}
            label="Átlagos haladás"
            value={stats.averageProgress}
            suffix="%"
            isLoading={loading}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Szűrők:</span>
          </div>

          <select
            value={selectedMasterclass}
            onChange={(e) => setSelectedMasterclass(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent text-sm"
          >
            <option value="all">Minden képzés</option>
            {masterclasses.map((mc) => (
              <option key={mc.id} value={mc.id}>
                {mc.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {[
              { value: 'all', label: 'Mind' },
              { value: 'active', label: 'Aktív' },
              { value: 'at-risk', label: 'Lemaradásban' },
              { value: 'completed', label: 'Befejezett' },
              { value: 'not-started', label: 'Nem kezdett' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-brand-secondary text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Employee Progress Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Alkalmazotti haladás ({filteredEmployees.length})
          </h2>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
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
                    Utolsó aktivitás
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                  <tr key={`${emp.employeeId}-${emp.masterclassId}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-secondary">
                            {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {emp.employeeName}
                          </div>
                          <div className="text-xs text-gray-500">{emp.email}</div>
                          {emp.jobTitle && (
                            <div className="text-xs text-gray-400">{emp.jobTitle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.masterclassTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 w-24">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                emp.progressPercent === 100
                                  ? 'bg-green-500'
                                  : emp.status === 'at-risk'
                                  ? 'bg-red-500'
                                  : 'bg-brand-secondary/50'
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary-hover">
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
                          className="inline-flex items-center px-3 py-1.5 text-sm text-brand-secondary hover:text-brand-secondary-hover hover:bg-brand-secondary/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
