'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCustomClaims, useClaimsManagement, CustomClaims } from '@/hooks/useCustomClaims';
import { UserRole } from '@/lib/auth/authProvider';
import { 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Edit,
  History,
  Trash2,
  Users
} from 'lucide-react';

interface ClaimsManagerProps {
  userId?: string;
  showAuditLog?: boolean;
  adminView?: boolean;
}

export function ClaimsManager({ 
  userId, 
  showAuditLog = false, 
  adminView = false 
}: ClaimsManagerProps) {
  const {
    claims,
    loading,
    error,
    validation,
    refreshClaims,
    validateClaims,
    updateClaims,
    removeClaims,
    getAuditLog
  } = useCustomClaims(userId);

  const {
    hasAdminPrivileges,
    batchUpdateClaims,
    cleanupExpiredClaims
  } = useClaimsManagement();

  const [editMode, setEditMode] = useState(false);
  const [editClaims, setEditClaims] = useState<Partial<CustomClaims>>({});
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load audit log if needed
  useEffect(() => {
    if (showAuditLog && userId && hasAdminPrivileges) {
      loadAuditLog();
    }
  }, [showAuditLog, userId, hasAdminPrivileges]);

  const loadAuditLog = async () => {
    if (!userId) return;
    
    try {
      const log = await getAuditLog(userId, 20);
      setAuditLog(log);
    } catch (error) {
      console.error('Error loading audit log:', error);
    }
  };

  const handleRefreshClaims = async () => {
    setActionLoading('refresh');
    try {
      await refreshClaims();
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateClaims = async () => {
    setActionLoading('validate');
    try {
      await validateClaims();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateClaims = async () => {
    if (!userId) return;
    
    setActionLoading('update');
    try {
      await updateClaims(userId, editClaims);
      setEditMode(false);
      setEditClaims({});
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveClaim = async (claimKey: keyof CustomClaims) => {
    if (!userId) return;
    
    setActionLoading(`remove-${claimKey}`);
    try {
      await removeClaims(userId, [claimKey]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanupExpiredClaims = async () => {
    setActionLoading('cleanup');
    try {
      await cleanupExpiredClaims();
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = () => {
    setEditClaims(claims || {});
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditClaims({});
  };

  const getClaimStatusBadge = (consistent: boolean) => {
    return consistent ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Érvényes
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Problémás
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('hu-HU');
  };

  const formatLastUpdated = (lastUpdated?: number) => {
    if (!lastUpdated) return 'Ismeretlen';
    
    const date = new Date(lastUpdated);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Kevesebb mint 1 órája';
    if (diffHours < 24) return `${diffHours} órája`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} napja`;
  };

  if (loading && !claims) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Jogosultságok betöltése...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Claims Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Egyedi Jogosultságok
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshClaims}
                disabled={loading || actionLoading === 'refresh'}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                Frissítés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidateClaims}
                disabled={loading || actionLoading === 'validate'}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Ellenőrzés
              </Button>
              {hasAdminPrivileges && !editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Szerkesztés
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!claims ? (
            <Alert>
              <AlertDescription>
                Nincsenek egyedi jogosultságok beállítva ehhez a felhasználóhoz.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Claims Display/Edit Mode */}
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Szerepkör</Label>
                      <Select
                        value={editClaims.role || ''}
                        onValueChange={(value) => setEditClaims(prev => ({ ...prev, role: value as UserRole }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Válassz szerepkört" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.STUDENT}>Hallgató</SelectItem>
                          <SelectItem value={UserRole.INSTRUCTOR}>Oktató</SelectItem>
                          <SelectItem value={UserRole.UNIVERSITY_ADMIN}>Egyetemi Admin</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Rendszer Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="universityId">Egyetem ID</Label>
                      <Input
                        id="universityId"
                        value={editClaims.universityId || ''}
                        onChange={(e) => setEditClaims(prev => ({ ...prev, universityId: e.target.value }))}
                        placeholder="Egyetem azonosító"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departmentId">Tanszék ID</Label>
                      <Input
                        id="departmentId"
                        value={editClaims.departmentId || ''}
                        onChange={(e) => setEditClaims(prev => ({ ...prev, departmentId: e.target.value }))}
                        placeholder="Tanszék azonosító"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleUpdateClaims}
                      disabled={actionLoading === 'update'}
                    >
                      {actionLoading === 'update' && <RefreshCw className="w-4 h-4 mr-1 animate-spin" />}
                      Mentés
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Mégse
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Szerepkör</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{claims.role}</Badge>
                      {hasAdminPrivileges && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClaim('role')}
                          disabled={actionLoading === 'remove-role'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {claims.universityId && (
                    <div className="space-y-2">
                      <Label>Egyetem ID</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{claims.universityId}</span>
                        {hasAdminPrivileges && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClaim('universityId')}
                            disabled={actionLoading === 'remove-universityId'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {claims.departmentId && (
                    <div className="space-y-2">
                      <Label>Tanszék ID</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{claims.departmentId}</span>
                        {hasAdminPrivileges && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClaim('departmentId')}
                            disabled={actionLoading === 'remove-departmentId'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Utolsó frissítés</Label>
                    <span className="text-sm text-gray-600">
                      {formatLastUpdated(claims.lastUpdated)}
                    </span>
                  </div>
                </div>
              )}

              {/* Permissions Display */}
              {claims.permissions && claims.permissions.length > 0 && (
                <div className="space-y-2">
                  <Label>Jogosultságok</Label>
                  <div className="flex flex-wrap gap-1">
                    {claims.permissions.map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getClaimStatusBadge(validation.consistent)}
              <span className="ml-2">Jogosultság Ellenőrzés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.issues.length > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">Problémák:</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {validation.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validation.recommendations.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-brand-secondary">Javaslatok:</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {validation.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-brand-secondary">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Controls */}
      {adminView && hasAdminPrivileges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Admin Műveletek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCleanupExpiredClaims}
                disabled={actionLoading === 'cleanup'}
              >
                {actionLoading === 'cleanup' && <RefreshCw className="w-4 h-4 mr-1 animate-spin" />}
                Lejárt Jogosultságok Tisztítása
              </Button>
              
              {showAuditLog && (
                <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={loadAuditLog}>
                      <History className="w-4 h-4 mr-1" />
                      Naplózás Előzmények
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Jogosultság Változások Naplója</DialogTitle>
                      <DialogDescription>
                        A felhasználó jogosultság változásainak előzményei
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      {auditLog.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Művelet</TableHead>
                              <TableHead>Végrehajtó</TableHead>
                              <TableHead>Időpont</TableHead>
                              <TableHead>Részletek</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLog.map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge variant="outline">{entry.action}</Badge>
                                </TableCell>
                                <TableCell>{entry.requestorUserId}</TableCell>
                                <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {JSON.stringify(entry.claims || {}, null, 2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            Nincsenek naplózott események.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}