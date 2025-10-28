import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Mock hooks - these would be replaced with real API calls
const useBulkPublishCourses = () => ({
  mutate: (courseIds: string[]) => {
    console.log('Publishing courses:', courseIds);
    toast.success(`${courseIds.length} kurzus közzétéve!`);
  },
  isLoading: false,
});

const useBulkDeleteCourses = () => ({
  mutate: (courseIds: string[]) => {
    console.log('Deleting courses:', courseIds);
    toast.success(`${courseIds.length} kurzus törölve!`);
  },
  isLoading: false,
});

export const BulkCourseActions = () => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const bulkPublish = useBulkPublishCourses();
  const bulkDelete = useBulkDeleteCourses();

  const handleSelectAll = () => {
    // Mock course IDs - would come from actual data
    setSelectedCourses(['1', '2', '3']);
  };

  const handleDeselectAll = () => {
    setSelectedCourses([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tömeges Műveletek</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleSelectAll}
            variant="outline"
            size="sm"
          >
            Összes kiválasztása
          </Button>
          <Button 
            onClick={handleDeselectAll}
            variant="outline"
            size="sm"
          >
            Kiválasztás törlése
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => bulkPublish.mutate(selectedCourses)}
            disabled={selectedCourses.length === 0}
            variant="default"
          >
            Kiválasztottak közzététele ({selectedCourses.length})
          </Button>
          <Button 
            variant="destructive"
            onClick={() => bulkDelete.mutate(selectedCourses)}
            disabled={selectedCourses.length === 0}
          >
            Kiválasztottak törlése ({selectedCourses.length})
          </Button>
        </div>

        {selectedCourses.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedCourses.length} kurzus kiválasztva
          </p>
        )}
      </CardContent>
    </Card>
  );
}; 