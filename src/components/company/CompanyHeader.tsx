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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <>
                <Link
                  href={backHref}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="font-medium">Vissza</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{companyName || title}</span>
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </nav>
  );
}
