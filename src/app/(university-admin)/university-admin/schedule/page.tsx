'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, BookOpen, Plus, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface ScheduleEvent {
  id: string;
  title: string;
  type: 'lecture' | 'exam' | 'seminar' | 'workshop';
  courseTitle: string;
  instructor: string;
  location: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
}

export default function UniversityAdminSchedulePage() {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - később Firebase-ből jönne
  const scheduleEvents: ScheduleEvent[] = [
    {
      id: '1',
      title: 'Web Development Alapok - Előadás',
      type: 'lecture',
      courseTitle: 'Web Development Alapok',
      instructor: 'Dr. Nagy János',
      location: 'A201 terem',
      startTime: new Date(2024, 0, 15, 10, 0),
      endTime: new Date(2024, 0, 15, 12, 0),
      attendees: 45
    },
    {
      id: '2',
      title: 'React.js Workshop',
      type: 'workshop',
      courseTitle: 'React.js Haladó',
      instructor: 'Kiss Péter',
      location: 'Számítógép labor 3',
      startTime: new Date(2024, 0, 15, 14, 0),
      endTime: new Date(2024, 0, 15, 16, 0),
      attendees: 20
    },
    {
      id: '3',
      title: 'Python Vizsga',
      type: 'exam',
      courseTitle: 'Python Programozás',
      instructor: 'Dr. Szabó Anna',
      location: 'B102 terem',
      startTime: new Date(2024, 0, 16, 9, 0),
      endTime: new Date(2024, 0, 16, 11, 0),
      attendees: 60
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-brand-secondary/10 text-brand-secondary-hover border-brand-secondary/30';
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'seminar':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'workshop':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeBadge = (type: string) => {
    const labels = {
      lecture: 'Előadás',
      exam: 'Vizsga',
      seminar: 'Szeminárium',
      workshop: 'Workshop'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ütemezés</h1>
          <p className="text-muted-foreground">
            Tartalmak és események ütemezése
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={viewType} onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Napi nézet</SelectItem>
              <SelectItem value="week">Heti nézet</SelectItem>
              <SelectItem value="month">Havi nézet</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Szűrők
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Új esemény
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mai események</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 előadás, 2 vizsga, 7 egyéb</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Heti óraszám</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">168</div>
            <p className="text-xs text-muted-foreground">42 tartalom összesen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teremkihasználtság</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">15 szabad terem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktív oktatók</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">Mai napon</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Január 15-21, 2024</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Előző</Button>
              <Button variant="outline" size="sm">Ma</Button>
              <Button variant="outline" size="sm">Következő</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time slots */}
            <div className="grid grid-cols-8 gap-2 text-sm">
              <div className="font-medium text-muted-foreground">Idő</div>
              <div className="font-medium text-center">Hétfő</div>
              <div className="font-medium text-center">Kedd</div>
              <div className="font-medium text-center">Szerda</div>
              <div className="font-medium text-center">Csütörtök</div>
              <div className="font-medium text-center">Péntek</div>
              <div className="font-medium text-center">Szombat</div>
              <div className="font-medium text-center">Vasárnap</div>
            </div>

            {/* Events list for now - később teljes calendar grid */}
            <div className="space-y-3 mt-6">
              {scheduleEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-2 ${getEventTypeColor(event.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getEventTypeColor(event.type)}>
                          {getEventTypeBadge(event.type)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>
                      <h3 className="font-bold mb-1">{event.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3" />
                          {event.courseTitle}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {event.instructor} • {event.attendees} résztvevő
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Szerkesztés
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Közelgő események</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.startTime)} • {event.location} • {event.attendees} fő
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{getEventTypeBadge(event.type)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}