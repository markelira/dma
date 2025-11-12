'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getFirestore, collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Building2, GraduationCap, Users, Plus } from 'lucide-react';
import { Company, CompanyMasterclass, CompanyEmployee } from '@/types/company';

export default function MasterclassesPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [masterclasses, setMasterclasses] = useState<CompanyMasterclass[]>([]);
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect_to=/company/dashboard/masterclasses');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const db = getFirestore();
      const companyId = user!.companyId;

      if (!companyId) {
        setError('Nem található vállalat');
        setLoading(false);
        return;
      }

      // Load company
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
      }

      // Load masterclasses
      const masterclassesSnapshot = await getDocs(
        collection(db, 'companies', companyId, 'masterclasses')
      );

      const masterclassesList: CompanyMasterclass[] = masterclassesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          masterclassId: data.masterclassId,
          title: data.title,
          duration: data.duration,
          seats: data.seats,
          pricePerSeat: data.pricePerSeat,
          totalPaid: data.totalPaid,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          status: data.status,
          companyId: companyId,
          purchasedAt: data.purchasedAt,
          purchasedBy: data.purchasedBy
        };
      });

      setMasterclasses(masterclassesList);

      // Load employees
      const employeesSnapshot = await getDocs(
        collection(db, 'companies', companyId, 'employees')
      );

      const employeesList: CompanyEmployee[] = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        fullName: `${doc.data().firstName} ${doc.data().lastName}`,
        ...doc.data(),
      } as CompanyEmployee));

      setEmployees(employeesList);

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Hiba történt az adatok betöltése során');
      setLoading(false);
    }
  };

  const getEnrolledCount = (masterclassId: string) => {
    return employees.filter(emp =>
      emp.enrolledMasterclasses?.some(e => e.masterclassId === masterclassId)
    ).length;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hiba</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/company/dashboard"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Vissza a vezérlőpulthoz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/company/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Vissza a vezérlőpulthoz
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center mt-2">
                  <GraduationCap className="w-6 h-6 mr-2" />
                  Masterclass-ok
                </h1>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-1" />
                  {company?.name}
                </div>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Helyek vásárlása
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Masterclasses List */}
        {masterclasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Még nincs masterclass
            </h3>
            <p className="mt-2 text-gray-600">
              Vásárolj masterclass helyeket, hogy elkezd a csapatod képzését.
            </p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
              >
                Masterclass-ok böngészése
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {masterclasses.map((masterclass) => {
              const enrolledCount = getEnrolledCount(masterclass.id);

              return (
                <div
                  key={masterclass.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {masterclass.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {masterclass.duration} hetes program
                        </p>

                        {/* Status Badge */}
                        <div className="mt-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              masterclass.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : masterclass.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {masterclass.status === 'active' && 'Aktív'}
                            {masterclass.status === 'scheduled' && 'Ütemezett'}
                            {masterclass.status === 'completed' && 'Befejezett'}
                          </span>
                        </div>
                      </div>

                      {/* Seat Stats */}
                      <div className="ml-6 text-right">
                        <div className="text-3xl font-bold text-teal-600">
                          {masterclass.seats.available}
                        </div>
                        <div className="text-sm text-gray-600">szabad hely</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {masterclass.seats.used} használt / {masterclass.seats.purchased} vásárolt
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 flex gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Kezdés:</span>{' '}
                        {masterclass.startDate?.toLocaleDateString('hu-HU')}
                      </div>
                      <div>
                        <span className="font-medium">Befejezés:</span>{' '}
                        {masterclass.endDate?.toLocaleDateString('hu-HU')}
                      </div>
                    </div>

                    {/* Enrolled Employees Count */}
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="font-medium">{enrolledCount}</span> alkalmazott beiratkozva
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/company/dashboard/masterclasses/${masterclass.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Alkalmazottak kezelése
                      </Link>

                      {masterclass.seats.available === 0 && (
                        <span className="text-sm text-amber-600 self-center">
                          Nincs több szabad hely
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
