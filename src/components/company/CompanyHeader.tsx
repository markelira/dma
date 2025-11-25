import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';

interface CompanyHeaderProps {
  companyName?: string;
  showBackButton?: boolean;
  backHref?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function CompanyHeader({
  companyName,
  showBackButton = false,
  backHref = '/company/dashboard',
  title,
  subtitle,
  actions
}: CompanyHeaderProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <>
                <Link
                  href={backHref}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="font-medium">Vissza</span>
                </Link>
                <div className="h-6 w-px bg-gray-300/50"></div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900">{companyName || title}</span>
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </nav>
  );
}
