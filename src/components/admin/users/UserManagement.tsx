import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

// Mock data and hooks - these would be replaced with real API calls
const useUsers = () => ({
  data: [
    { id: '1', name: 'János Kovács', email: 'janos@example.com', role: 'USER', status: 'active' },
    { id: '2', name: 'Mária Nagy', email: 'maria@example.com', role: 'INSTRUCTOR', status: 'active' },
    { id: '3', name: 'Péter Kiss', email: 'peter@example.com', role: 'ADMIN', status: 'active' },
  ] as User[],
  isLoading: false,
});

const useUpdateUserRole = () => ({
  mutate: (data: { userId: string; role: string }) => {
    console.log('Updating user role:', data);
    toast.success('Felhasználói szerepkör frissítve!');
  },
  isLoading: false,
});

const useDeleteUser = () => ({
  mutate: (userId: string) => {
    console.log('Deleting user:', userId);
    toast.success('Felhasználó törölve!');
  },
  isLoading: false,
});

export const UserManagement = () => {
  const { data: users } = useUsers();
  const updateUserRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Felhasználók Kezelése</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Felhasználó</SelectItem>
                    <SelectItem value="INSTRUCTOR">Oktató</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Törlés
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 