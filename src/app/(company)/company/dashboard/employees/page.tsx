'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2,
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
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs, Timestamp, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Link from 'next/link';
import { Company, CompanyEmployee, AddEmployeeInput } from '@/types/company';

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

        // Get companyId from user custom claims
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{error}</h2>
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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/company/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Vissza</span>
              </Link>
              <div className="h-6 w-px bg-gray-300/50"></div>
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-900">{company?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-gray-600" />
                Alkalmazottak
              </h1>
              <p className="mt-2 text-gray-600">
                Kezeld a vállalat alkalmazottait és küldj meghívókat
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn inline-flex items-center bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md transition-all"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Új alkalmazott
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Összes alkalmazott</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Aktív</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Meghívott</p>
            <p className="text-3xl font-bold text-amber-600">{stats.invited}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés név, email vagy pozíció szerint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full pl-10 pr-3 py-2"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="form-input px-3 py-2"
              >
                <option value="all">Minden státusz</option>
                <option value="active">Aktív</option>
                <option value="invited">Meghívott</option>
                <option value="left">Kilépett</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-white/40">
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
              <tbody className="bg-white/20 divide-y divide-gray-200/50">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Nincs találat a keresési feltételekkel'
                        : 'Még nincs hozzáadott alkalmazott. Kezdd el az első meghívó küldésével!'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
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
                        {employee.status === 'invited' && employee.inviteToken && (
                          <button
                            onClick={() => copyInviteLink(employee)}
                            className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && filteredEmployees.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200/50">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn w-full bg-white/60 hover:bg-white/80 text-gray-900 border border-gray-200/50 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Betöltés...
                  </>
                ) : (
                  <>
                    Több betöltése ({EMPLOYEES_PER_PAGE} alkalmazott)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Új alkalmazott hozzáadása</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keresztnév <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="pl. János"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vezetéknév <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="pl. Kovács"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email cím <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="janos.kovacs@pelda.hu"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozíció (opcionális)
                  </label>
                  <input
                    type="text"
                    value={newEmployee.jobTitle}
                    onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    disabled={submitting}
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="btn flex-1 bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center justify-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Küldés...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Meghívó küldése
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
