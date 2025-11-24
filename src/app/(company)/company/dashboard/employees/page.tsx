'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  UserPlus,
  Mail,
  CheckCircle2,
  Clock,
  X,
  Copy,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  UserMinus,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Link from 'next/link';
import { Company, CompanyEmployee, AddEmployeeInput } from '@/types/company';
import { useRemoveEmployee } from '@/hooks/useCompanyActions';
import { StatCard } from '@/components/dashboard/StatCard';

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited' | 'left'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<CompanyEmployee | null>(null);

  // Remove employee mutation
  const removeEmployeeMutation = useRemoveEmployee();

  // Pagination state
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const EMPLOYEES_PER_PAGE = 50;

  const [newEmployee, setNewEmployee] = useState({
    email: '',
    firstName: '',
    lastName: '',
    jobTitle: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push('/login?redirect_to=/company/dashboard/employees');
        return;
      }

      try {
        const db = getFirestore();
        const companyId = user.companyId;

        if (!companyId) {
          setError('Nem található vállalati fiók');
          return;
        }

        // Get company document
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          setError('Nem található vállalati fiók');
          return;
        }

        const userCompany: Company = {
          id: companySnap.id,
          name: companySnap.data().name,
          slug: companySnap.data().slug,
          ...companySnap.data() as Omit<Company, 'id'>
        };

        setCompany(userCompany);

        // Fetch employees with pagination
        const employeesRef = collection(db, 'companies', userCompany.id, 'employees');
        const employeesQuery = query(
          employeesRef,
          orderBy('invitedAt', 'desc'),
          limit(EMPLOYEES_PER_PAGE)
        );
        const employeesSnapshot = await getDocs(employeesQuery);

        const employeesList: CompanyEmployee[] = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: `${doc.data().firstName} ${doc.data().lastName}`,
          ...doc.data() as Omit<CompanyEmployee, 'id' | 'fullName'>
        }));

        setEmployees(employeesList);

        // Set pagination state
        if (employeesSnapshot.docs.length > 0) {
          setLastDoc(employeesSnapshot.docs[employeesSnapshot.docs.length - 1]);
          setHasMore(employeesSnapshot.docs.length === EMPLOYEES_PER_PAGE);
        } else {
          setHasMore(false);
        }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Hiba történt az adatok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const loadMore = async () => {
    if (!company || !lastDoc || !hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const db = getFirestore();
      const employeesRef = collection(db, 'companies', company.id, 'employees');
      const employeesQuery = query(
        employeesRef,
        orderBy('invitedAt', 'desc'),
        startAfter(lastDoc),
        limit(EMPLOYEES_PER_PAGE)
      );
      const employeesSnapshot = await getDocs(employeesQuery);

      const moreEmployees: CompanyEmployee[] = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        fullName: `${doc.data().firstName} ${doc.data().lastName}`,
        ...doc.data() as Omit<CompanyEmployee, 'id' | 'fullName'>
      }));

      setEmployees(prev => [...prev, ...moreEmployees]);

      if (employeesSnapshot.docs.length > 0) {
        setLastDoc(employeesSnapshot.docs[employeesSnapshot.docs.length - 1]);
        setHasMore(employeesSnapshot.docs.length === EMPLOYEES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more employees:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) return;

    setSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!newEmployee.email || !newEmployee.firstName || !newEmployee.lastName) {
        setError('Kérlek töltsd ki az összes kötelező mezőt');
        setSubmitting(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmployee.email)) {
        setError('Érvénytelen email cím');
        setSubmitting(false);
        return;
      }

      const addEmployee = httpsCallable<AddEmployeeInput, { success: boolean; employeeId: string; inviteToken: string }>(
        functions,
        'addEmployee'
      );

      const result = await addEmployee({
        companyId: company.id,
        email: newEmployee.email.trim().toLowerCase(),
        firstName: newEmployee.firstName.trim(),
        lastName: newEmployee.lastName.trim(),
        jobTitle: newEmployee.jobTitle.trim() || undefined
      });

      if (result.data.success) {
        // Refresh employee list
        const db = getFirestore();
        const employeesRef = collection(db, 'companies', company.id, 'employees');
        const employeesQuery = query(employeesRef, orderBy('invitedAt', 'desc'));
        const employeesSnapshot = await getDocs(employeesQuery);

        const employeesList: CompanyEmployee[] = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: `${doc.data().firstName} ${doc.data().lastName}`,
          ...doc.data() as Omit<CompanyEmployee, 'id' | 'fullName'>
        }));

        setEmployees(employeesList);

        // Reset form and close modal
        setNewEmployee({
          email: '',
          firstName: '',
          lastName: '',
          jobTitle: ''
        });
        setShowAddModal(false);
      }

    } catch (err: any) {
      console.error('Error adding employee:', err);

      if (err.code === 'already-exists') {
        setError('Ez az email cím már szerepel az alkalmazottak között');
      } else {
        setError(err.message || 'Hiba történt az alkalmazott hozzáadása során');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = async (employee: CompanyEmployee) => {
    if (!employee.inviteToken) return;

    const inviteUrl = `${window.location.origin}/company/invite/${employee.inviteToken}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(employee.id);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRemoveEmployee = async (employee: CompanyEmployee) => {
    if (!company?.id || !employee.id) return;

    setRemovingEmployeeId(employee.id);
    setShowRemoveConfirm(null);

    try {
      await removeEmployeeMutation.mutateAsync({
        companyId: company.id,
        employeeId: employee.id,
      });

      // Remove from local state
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
    } catch (err: any) {
      console.error('Error removing employee:', err);
      setError(err.message || 'Hiba történt az alkalmazott eltávolítása során');
    } finally {
      setRemovingEmployeeId(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    // Status filter
    if (statusFilter !== 'all' && emp.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.jobTitle?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aktív
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Meghívott
          </span>
        );
      case 'left':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Kilépett
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link href="/company/dashboard" className="text-blue-600 hover:underline">
            Vissza a vezérlőpultra
          </Link>
        </div>
      </div>
    );
  }

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    invited: employees.filter(e => e.status === 'invited').length
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Alkalmazottak</h1>
          <p className="text-gray-500">Kezeld a vállalat alkalmazottait és küldj meghívókat</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Új alkalmazott
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Összes alkalmazott"
          value={stats.total}
          isLoading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Aktív"
          value={stats.active}
          isLoading={loading}
        />
        <StatCard
          icon={Clock}
          label="Meghívott"
          value={stats.invited}
          isLoading={loading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Keresés név, email vagy pozíció szerint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {[
              { value: 'all', label: 'Mind' },
              { value: 'active', label: 'Aktív' },
              { value: 'invited', label: 'Meghívott' },
              { value: 'left', label: 'Kilépett' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Név
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pozíció
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Státusz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Képzések
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Nincs találat a keresési feltételekkel'
                        : 'Még nincs hozzáadott alkalmazott'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <p className="text-sm text-gray-500 mt-1">Kezdd el az első meghívó küldésével!</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{employee.jobTitle || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.enrolledMasterclasses?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Copy invite link button - only for invited status */}
                        {employee.status === 'invited' && employee.inviteToken && (
                          <button
                            onClick={() => copyInviteLink(employee)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {copiedToken === employee.id ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Másolva!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Meghívó link
                              </>
                            )}
                          </button>
                        )}

                        {/* Remove button - for invited and active status */}
                        {employee.status !== 'left' && (
                          <button
                            onClick={() => setShowRemoveConfirm(employee)}
                            disabled={removingEmployeeId === employee.id}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={employee.status === 'invited' ? 'Meghívó visszavonása' : 'Eltávolítás'}
                          >
                            {removingEmployeeId === employee.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : employee.status === 'invited' ? (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Visszavonás
                              </>
                            ) : (
                              <>
                                <UserMinus className="w-4 h-4 mr-1" />
                                Eltávolítás
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && filteredEmployees.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Betöltés...
                </>
              ) : (
                <>Több betöltése ({EMPLOYEES_PER_PAGE} alkalmazott)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Új alkalmazott hozzáadása</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keresztnév <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="pl. János"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vezetéknév <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="pl. Kovács"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email cím <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="janos.kovacs@pelda.hu"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pozíció (opcionális)
                  </label>
                  <input
                    type="text"
                    value={newEmployee.jobTitle}
                    onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="pl. Marketing Manager"
                    disabled={submitting}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </form>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Mégse
                </button>
                <button
                  onClick={handleAddEmployee}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Küldés...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Meghívó küldése
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Employee Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <button
                    onClick={() => setShowRemoveConfirm(null)}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {showRemoveConfirm.status === 'invited'
                    ? 'Meghívó visszavonása'
                    : 'Alkalmazott eltávolítása'}
                </h3>

                <p className="text-gray-600 mb-6">
                  {showRemoveConfirm.status === 'invited' ? (
                    <>
                      Biztosan visszavonod <span className="font-medium">{showRemoveConfirm.fullName}</span> meghívóját?
                      A meghívó link többé nem lesz érvényes.
                    </>
                  ) : (
                    <>
                      Biztosan eltávolítod <span className="font-medium">{showRemoveConfirm.fullName}</span> alkalmazottat a vállalatból?
                      Az alkalmazott elveszíti hozzáférését a vállalati tartalmakhoz.
                    </>
                  )}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRemoveConfirm(null)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Mégse
                  </button>
                  <button
                    onClick={() => handleRemoveEmployee(showRemoveConfirm)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center"
                  >
                    {showRemoveConfirm.status === 'invited' ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Visszavonás
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Eltávolítás
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
