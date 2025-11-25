'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Terminal,
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  Info,
  Activity,
  Pause,
  Play,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details: string
  ipAddress: string
  userAgent: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: any
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [isLive, setIsLive] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const consoleRef = useRef<HTMLDivElement>(null)
  const endOfLogsRef = useRef<HTMLDivElement>(null)

  // Real-time audit logs subscription
  useEffect(() => {
    if (!isLive) return;

    const logsQuery = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData: AuditLogEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          userName: data.userName || 'Unknown',
          action: data.action || '',
          resource: data.resource || '',
          resourceId: data.resourceId || '',
          details: data.details || '',
          ipAddress: data.ipAddress || 'N/A',
          userAgent: data.userAgent || 'N/A',
          severity: data.severity || 'LOW',
          createdAt: data.createdAt
        });
      });

      // Sort by createdAt ascending for console display (newest at bottom)
      logsData.reverse();
      setLogs(logsData);
      setFilteredLogs(logsData);
    }, (error) => {
      console.error('Error fetching audit logs:', error);
    });

    return () => unsubscribe();
  }, [isLive]);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, severityFilter, logs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getActionColor = (action: string) => {
    // User authentication actions
    if (action.includes('LOGIN')) return 'text-cyan-400';
    if (action.includes('LOGOUT')) return 'text-gray-400';
    
    // Course actions
    if (action.includes('CREATE_COURSE')) return 'text-green-500';
    if (action.includes('PUBLISH_COURSE')) return 'text-emerald-400';
    if (action.includes('UPDATE_COURSE')) return 'text-brand-secondary';
    if (action.includes('DELETE_COURSE')) return 'text-red-500';
    if (action.includes('ENROLL_COURSE')) return 'text-indigo-400';
    
    // Ticket actions
    if (action.includes('CREATE_TICKET')) return 'text-purple-400';
    if (action.includes('ADMIN_RESPOND_TICKET')) return 'text-yellow-400';
    if (action.includes('CLOSE_TICKET')) return 'text-orange-400';
    if (action.includes('UPDATE_TICKET')) return 'text-brand-secondary-light';
    
    // Payment actions
    if (action.includes('PAYMENT')) return 'text-green-400';
    if (action.includes('PURCHASE')) return 'text-lime-400';
    
    // Generic CRUD actions
    if (action.includes('CREATE')) return 'text-green-400';
    if (action.includes('UPDATE')) return 'text-brand-secondary';
    if (action.includes('DELETE')) return 'text-red-400';
    
    return 'text-gray-400';
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatLogLine = (log: AuditLogEntry) => {
    const timestamp = formatTimestamp(log.createdAt);
    const severity = `[${log.severity}]`.padEnd(10);
    const action = log.action.padEnd(20);
    const user = `${log.userName} (${log.userEmail})`.padEnd(40);
    const resource = `${log.resource}${log.resourceId ? `#${log.resourceId}` : ''}`;
    
    return {
      timestamp,
      severity,
      action,
      user,
      resource,
      details: log.details ? ` - ${JSON.parse(log.details || '{}')?.subject || log.details}` : ''
    };
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Severity', 'Action', 'User', 'Email', 'Resource', 'Details'].join(','),
      ...filteredLogs.map(log => [
        formatTimestamp(log.createdAt),
        log.severity,
        log.action,
        log.userName,
        log.userEmail,
        `${log.resource}${log.resourceId ? `#${log.resourceId}` : ''}`,
        log.details
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Audit Console</h1>
          <Badge variant={isLive ? "default" : "secondary"} className="animate-pulse">
            {isLive ? 'LIVE' : 'PAUSED'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="gap-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearLogs}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportLogs}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Console Toolbar */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Filter logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 font-mono text-sm"
            />
          </div>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
          >
            <option value="all">All Severity</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Auto-scroll</span>
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{filteredLogs.length} events</span>
          </div>
        </div>
      </Card>

      {/* Console Display */}
      <Card className="flex-1 bg-gray-950 border-gray-800 overflow-hidden">
        <div 
          ref={consoleRef}
          className="h-full overflow-y-auto p-4 font-mono text-xs leading-relaxed"
          style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for audit events...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => {
                const formatted = formatLogLine(log);
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-2 hover:bg-gray-900/50 px-2 py-1 rounded group"
                  >
                    <span className="text-gray-600">{formatted.timestamp}</span>
                    <span className={cn('font-bold', getSeverityColor(log.severity))}>
                      {formatted.severity}
                    </span>
                    <span className={cn('font-bold', getActionColor(log.action))}>
                      {formatted.action}
                    </span>
                    <span className="text-cyan-400">{formatted.user}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-yellow-400">{formatted.resource}</span>
                    {formatted.details && (
                      <span className="text-gray-500">{formatted.details}</span>
                    )}
                  </div>
                );
              })}
              <div ref={endOfLogsRef} />
            </div>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">Severity:</span>
            <span className="text-green-500">● LOW</span>
            <span className="text-yellow-500">● MEDIUM</span>
            <span className="text-orange-500">● HIGH</span>
            <span className="text-red-500">● CRITICAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">Actions:</span>
            <span className="text-cyan-400">● LOGIN</span>
            <span className="text-green-500">● COURSE</span>
            <span className="text-purple-400">● TICKET</span>
            <span className="text-indigo-400">● ENROLL</span>
            <span className="text-yellow-400">● ADMIN</span>
            <span className="text-lime-400">● PAYMENT</span>
          </div>
        </div>
      </Card>
    </div>
  )
}