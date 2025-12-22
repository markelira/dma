'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  UserPlus,
  Mail,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  AlertCircle,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Link from 'next/link';
import { Company, CompanyEmployee, AddEmployeeInput, EmployeeProgress, CompanyDashboardData } from '@/types/company';
import { useRemoveEmployee } from '@/hooks/useCompanyActions';

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<CompanyEmployee | null>(null);

  // Remove employee mutation
  const removeEmployeeMutation = useRemoveEmployee();

  // Pagination state
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const EMPLOYEES_PER_PAGE = 50;
  const MAX_EMPLOYEES = 5;

  const [newEmployee, setNewEmployee] = useState({
    email: '',
    firstName: '',
    lastName: '',
    jobTitle: ''
  });

  // Progress tracking state
  const [progressEmployees, setProgressEmployees] = useState<EmployeeProgress[]>([]);
  const [progressStatusFilter, setProgressStatusFilter] = useState<string>('in-progress');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Progress tracking pagination
  const [progressPageSize, setProgressPageSize] = useState<number>(10);
  const [progressCurrentPage, setProgressCurrentPage] = useState(1);
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 0]; // 0 = all

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
          fullName: `${doc.data().lastName} ${doc.data().firstName}`,
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

  // Load progress data
  useEffect(() => {
    if (!user?.companyId || authLoading) return;

    const loadProgressData = async () => {
      setLoadingProgress(true);
      try {
        const getCompanyDashboard = httpsCallable(functions, 'getCompanyDashboard');

        const result = await getCompanyDashboard({ companyId: user.companyId });
        const data = result.data as CompanyDashboardData;

        setProgressEmployees(data.employees.map((emp: any) => ({
          ...emp,
          lastActivityAt: emp.lastActivityAt ? new Date(emp.lastActivityAt) : undefined,
          enrolledAt: new Date(emp.enrolledAt),
        })));
      } catch (err: any) {
        console.error('Error loading progress data:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgressData();
  }, [user, authLoading]);

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
        fullName: `${doc.data().lastName} ${doc.data().firstName}`,
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
          fullName: `${doc.data().lastName} ${doc.data().firstName}`,
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
        setError('Ez az email cím már szerepel a munkatársak között');
      } else if (err.code === 'resource-exhausted') {
        setError(`Elérted a maximális ${MAX_EMPLOYEES} munkatárs limitet. Távolíts el valakit, ha újat szeretnél hozzáadni.`);
      } else {
        setError(err.message || 'Hiba történt a munkatárs hozzáadása során');
      }
    } finally {
      setSubmitting(false);
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
      setError(err.message || 'Hiba történt a munkatárs eltávolítása során');
    } finally {
      setRemovingEmployeeId(null);
    }
  };

  // Computed values for filters
  const uniqueEmployees = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    progressEmployees.forEach((emp) => {
      if (!seen.has(emp.employeeId)) {
        seen.set(emp.employeeId, { id: emp.employeeId, name: emp.employeeName });
      }
    });
    return Array.from(seen.values());
  }, [progressEmployees]);

  // Filter progress by selected employee first
  const employeeFilteredProgress = useMemo(() => {
    if (selectedEmployee === 'all') return progressEmployees;
    return progressEmployees.filter(e => e.employeeId === selectedEmployee);
  }, [progressEmployees, selectedEmployee]);

  // "Folyamatban" - exclude 0% progress (those go to "Saját listán")
  const inProgressCount = employeeFilteredProgress.filter(e =>
    (e.status === 'active' || e.status === 'at-risk' || e.status === 'in-progress') && e.progressPercent > 0
  ).length;

  // "Saját listán" - enrolled with 0% progress (not started yet)
  const notStartedCount = employeeFilteredProgress.filter(e =>
    e.progressPercent === 0 && e.status !== 'completed' && e.status !== 'watchlist'
  ).length;

  const completedCount = employeeFilteredProgress.filter(e => e.status === 'completed').length;

  // Filtered progress data
  const filteredProgressData = useMemo(() => {
    return progressEmployees.filter((emp) => {
      // Employee filter
      if (selectedEmployee !== 'all' && emp.employeeId !== selectedEmployee) {
        return false;
      }

      // Status filter
      if (progressStatusFilter === 'in-progress') {
        // Only show items with progress > 0%
        return (emp.status === 'active' || emp.status === 'at-risk' || emp.status === 'in-progress') && emp.progressPercent > 0;
      }
      if (progressStatusFilter === 'not-started') {
        // Enrolled but 0% progress (not started yet)
        return emp.progressPercent === 0 && emp.status !== 'completed' && emp.status !== 'watchlist';
      }
      if (progressStatusFilter === 'completed') {
        return emp.status === 'completed';
      }

      return true;
    });
  }, [progressEmployees, selectedEmployee, progressStatusFilter]);

  // Sorted progress data
  const sortedProgressData = useMemo(() => {
    return [...filteredProgressData].sort((a, b) => {
      const statusOrder: Record<string, number> = { 'watchlist': 0, 'not-started': 1, 'in-progress': 1, 'active': 1, 'at-risk': 1, 'completed': 2 };
      const aOrder = statusOrder[a.status] ?? 1;
      const bOrder = statusOrder[b.status] ?? 1;

      if (aOrder !== bOrder) return aOrder - bOrder;

      // Within in-progress, sort by percentage ascending
      if (aOrder === 1) return a.progressPercent - b.progressPercent;

      return 0;
    });
  }, [filteredProgressData]);

  // Paginated progress data
  const paginatedProgressData = useMemo(() => {
    if (progressPageSize === 0) return sortedProgressData; // Show all
    const start = (progressCurrentPage - 1) * progressPageSize;
    return sortedProgressData.slice(start, start + progressPageSize);
  }, [sortedProgressData, progressCurrentPage, progressPageSize]);

  const totalProgressPages = progressPageSize === 0 ? 1 : Math.ceil(sortedProgressData.length / progressPageSize);

  // Employee limit calculation
  const activeEmployeeCount = employees.filter(e => e.status !== 'left').length;
  const remainingSlots = MAX_EMPLOYEES - activeEmployeeCount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            AKTÍV
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            MEGHÍVVA
          </span>
        );
      case 'left':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            INAKTÍV
          </span>
        );
    }
  };

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

  if (error && !company) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link href="/company/dashboard" className="text-brand-secondary hover:underline">
            Vissza a vezérlőpultra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Munkatársaim</h1>
          <p className="text-gray-600">
            {remainingSlots > 0
              ? `Még ${remainingSlots} munkatársat adhatsz hozzá (${activeEmployeeCount}/${MAX_EMPLOYEES})`
              : `Elérted a maximális ${MAX_EMPLOYEES} munkatárs limitet`
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={remainingSlots <= 0}
          className="inline-flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-medium hover:bg-brand-secondary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Új munkatárs hozzáadása
        </button>
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
                  E-mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Státusz
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-4">
                      Még nincs hozzáadott munkatársad
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-medium hover:bg-brand-secondary-hover transition-colors"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Első munkatárs hozzáadása
                    </button>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-secondary">
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
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {employee.status !== 'left' && (
                        <button
                          onClick={() => setShowRemoveConfirm(employee)}
                          disabled={removingEmployeeId === employee.id}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {removingEmployeeId === employee.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserMinus className="w-4 h-4 mr-1" />
                              Eltávolítás
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && employees.length > 0 && (
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
                <>Több betöltése ({EMPLOYEES_PER_PAGE} munkatárs)</>
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
                  <h2 className="text-xl font-bold text-gray-900">Új munkatárs hozzáadása</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vezetéknév <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="pl. Kovács"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keresztnév <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="pl. János"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="janos.kovacs@pelda.hu"
                    required
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
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg hover:bg-brand-secondary-hover transition-colors disabled:opacity-50 inline-flex items-center justify-center"
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

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Munkatárs eltávolítása
                </h3>

                <p className="text-gray-600 mb-6">
                  Biztosan eltávolítod <span className="font-medium">{showRemoveConfirm.fullName}</span> munkatársad az előfizetésből? Minden tartalomhoz való hozzáférését el fogja veszíteni.
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
                    <UserMinus className="w-4 h-4 mr-2" />
                    Eltávolítás
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Tracking Section - Added Below */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nyomonkövetés</h2>
          <p className="text-gray-600">Legyél naprakész munkatársaid előrehaladásával</p>
        </div>


        {/* Status Filter Buttons */}
        <div className="flex items-center gap-3 mb-4">
          {[
            { value: 'in-progress', label: 'Folyamatban', count: inProgressCount },
            { value: 'not-started', label: 'Saját listán', count: notStartedCount },
            { value: 'completed', label: 'Befejezve', count: completedCount },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setProgressStatusFilter(option.value);
                setProgressCurrentPage(1); // Reset page when filter changes
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                progressStatusFilter === option.value
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {/* Employee Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => {
              setSelectedEmployee('all');
              setProgressCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedEmployee === 'all'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Minden munkatársam
          </button>
          {uniqueEmployees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => {
                setSelectedEmployee(emp.id);
                setProgressCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedEmployee === emp.id
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {emp.name}
            </button>
          ))}
        </div>

        {/* Employee Progress Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loadingProgress ? (
            <div className="p-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-brand-secondary" />
              <p className="text-gray-600">Betöltés...</p>
            </div>
          ) : paginatedProgressData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Nincs találat
              </h4>
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
                      Név
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tartalom
                    </th>
                    {progressStatusFilter !== 'not-started' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Haladás
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedProgressData.map((emp) => (
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{emp.masterclassTitle}</div>
                      </td>
                      {progressStatusFilter !== 'not-started' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {emp.status === 'completed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                              Befejezve
                            </span>
                          ) : emp.progressPercent === 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                              Saját listán
                            </span>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 w-24">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 transition-all"
                                    style={{ width: `${emp.progressPercent}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-medium text-amber-600">
                                {emp.progressPercent}%
                              </span>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {sortedProgressData.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sorok száma:</span>
                <select
                  value={progressPageSize}
                  onChange={(e) => {
                    setProgressPageSize(Number(e.target.value));
                    setProgressCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size === 0 ? 'Mind' : size}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 ml-2">
                  ({sortedProgressData.length} összesen)
                </span>
              </div>

              {totalProgressPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProgressCurrentPage(p => Math.max(1, p - 1))}
                    disabled={progressCurrentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Előző
                  </button>
                  <span className="text-sm text-gray-600">
                    {progressCurrentPage} / {totalProgressPages}
                  </span>
                  <button
                    onClick={() => setProgressCurrentPage(p => Math.min(totalProgressPages, p + 1))}
                    disabled={progressCurrentPage === totalProgressPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Következő
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
