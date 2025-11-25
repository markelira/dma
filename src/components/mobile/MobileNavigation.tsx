import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white h-full w-64 p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Menü</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="space-y-4">
              <a 
                href="/dashboard" 
                className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Vezérlőpult
              </a>
              <a 
                href="/courses" 
                className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Kurzusok
              </a>
              <a 
                href="/admin" 
                className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </a>
              <a 
                href="/profile" 
                className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Profil
              </a>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}; 