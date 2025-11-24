'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Download,
  Calendar,
  Filter,
  FileText,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function UniversityAdminReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  const exportReport = async (type: string) => {
    setLoading(true);
    try {
      // Itt lenne a jelentés generálási logika
      toast.success(`${type} jelentés exportálva`);
    } catch (error) {
      toast.error('Hiba történt az exportálás során');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jelentések</h1>
          <p className="text-muted-foreground">
            Részletes jelentések és elemzések az egyetemről
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Elmúlt 7 nap</SelectItem>
            <SelectItem value="month">Elmúlt hónap</SelectItem>
            <SelectItem value="quarter">Elmúlt negyedév</SelectItem>
            <SelectItem value="year">Elmúlt év</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Available Reports */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('enrollment')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Beiratkozási jelentés</CardTitle>
            <CardDescription>
              Részletes adatok a beiratkozásokról és trendekről
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>243 új beiratkozás ebben a hónapban</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('financial')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Pénzügyi jelentés</CardTitle>
            <CardDescription>
              Bevételek, költségek és pénzügyi teljesítmény
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>+15% növekedés az előző hónaphoz képest</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-purple-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('student')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Hallgatói jelentés</CardTitle>
            <CardDescription>
              Hallgatói teljesítmény és aktivitás statisztikák
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>1,234 aktív hallgató</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('course')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Tartalom jelentés</CardTitle>
            <CardDescription>
              Tartalom teljesítmény és befejezési arányok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>89 aktív tartalom</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-indigo-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('instructor')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Oktatói jelentés</CardTitle>
            <CardDescription>
              Oktatói teljesítmény és értékelések
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>45 aktív oktató</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-teal-600" />
              <Button size="sm" variant="outline" onClick={() => exportReport('attendance')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle>Jelenléti jelentés</CardTitle>
            <CardDescription>
              Hallgatói aktivitás és részvételi arányok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>92% átlagos részvétel</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Havi bevétel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.2M Ft</div>
            <p className="text-xs text-muted-foreground">+12% előző hónaphoz képest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Új beiratkozások</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">243</div>
            <p className="text-xs text-muted-foreground">Ebben a hónapban</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Befejezési arány</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Átlagos befejezés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hallgatói elégedettség</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5</div>
            <p className="text-xs text-muted-foreground">Átlagos értékelés</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}