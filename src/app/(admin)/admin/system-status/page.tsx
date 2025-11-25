'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Server, 
  Database, 
  Globe, 
  Shield, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  HardDrive,
  Cpu,
  Users,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface SystemMetric {
  name: string
  status: 'operational' | 'degraded' | 'down'
  value: number
  maxValue: number
  unit: string
  lastChecked: string
}

// Mock system metrics for demo
const systemMetrics: SystemMetric[] = [
  {
    name: 'Web Szerver',
    status: 'operational',
    value: 99.9,
    maxValue: 100,
    unit: '%',
    lastChecked: '2 perce'
  },
  {
    name: 'Adatbázis',
    status: 'operational',
    value: 85,
    maxValue: 100,
    unit: '% CPU',
    lastChecked: '1 perce'
  },
  {
    name: 'Tároló',
    status: 'operational',
    value: 65,
    maxValue: 100,
    unit: '% használt',
    lastChecked: '5 perce'
  },
  {
    name: 'API Válaszidő',
    status: 'operational',
    value: 120,
    maxValue: 500,
    unit: 'ms',
    lastChecked: '1 perce'
  }
]

export default function AdminSystemStatusPage() {
  const { user } = useAuthStore()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Működik
          </Badge>
        )
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200" variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Csökkent teljesítmény
          </Badge>
        )
      case 'down':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Leállt
          </Badge>
        )
      default:
        return null
    }
  }

  if (user?.role !== 'ADMIN') {
    return <div>Nincs jogosultsága az oldal megtekintéséhez</div>
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-brand-secondary rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Rendszer Állapot</h1>
              <p className="text-cyan-100 text-lg">
                Platform teljesítmény és állapot monitorozás
              </p>
            </div>
            <div className="hidden lg:block">
              <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Minden rendszer működik
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Rendszer Áttekintés</h2>
          <Badge className="bg-cyan-100 text-cyan-700">
            <Activity className="w-3 h-3 mr-1" />
            Valós idejű monitoring
          </Badge>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Kiváló
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  99.98%
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Elérhetőség
                </div>
                <div className="text-xs text-gray-500">
                  Elmúlt 30 nap
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-brand-secondary/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-secondary" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  342
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Aktív Felhasználók
                </div>
                <div className="text-xs text-gray-500">
                  Jelenleg online
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  124ms
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Átlag Válaszidő
                </div>
                <div className="text-xs text-gray-500">
                  API hívások
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  0
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Hibák
                </div>
                <div className="text-xs text-gray-500">
                  Elmúlt 24 óra
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Components */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rendszer Komponensek</span>
            <Badge variant="outline" className="text-xs">
              <Server className="w-3 h-3 mr-1" />
              {systemMetrics.length} komponens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metric.name}</span>
                    {getStatusBadge(metric.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.value}{metric.unit} / {metric.maxValue}{metric.unit}
                  </div>
                </div>
                <Progress value={(metric.value / metric.maxValue) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Utoljára ellenőrizve: {metric.lastChecked}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Szolgáltatások</span>
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Mind aktív
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Server className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-medium">Web Szerver (Nginx)</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Aktív
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-secondary/5 to-indigo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-brand-secondary" />
                  </div>
                  <span className="font-medium">Firestore Adatbázis</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Aktív
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium">CDN (Cloudflare)</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Aktív
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="font-medium">Firebase Auth</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Aktív
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Erőforrás Használat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span className="text-sm">CPU Használat</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm">Memória</span>
                  </div>
                  <span className="text-sm font-medium">62%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Tároló</span>
                  </div>
                  <span className="text-sm font-medium">73%</span>
                </div>
                <Progress value={73} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Sávszélesség</span>
                  </div>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <Progress value={28} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}