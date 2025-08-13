'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Activity, 
  Settings,
  Bell,
  Users,
  Database
} from 'lucide-react';

interface DebugPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
  dashboardType?: 'user' | 'therapist' | 'partner' | 'admin';
  state?: any;
  dispatch?: any;
}

export function DebugPanel({ 
  isVisible = false, 
  onClose, 
  dashboardType = 'user',
  state,
  dispatch 
}: DebugPanelProps) {
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });

  // Update memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const memory = (performance as any).memory;
        if (memory) {
          setMemoryUsage({
            used: Math.round(memory.usedJSHeapSize / 1048576),
            total: Math.round(memory.totalJSHeapSize / 1048576),
            limit: Math.round(memory.jsHeapSizeLimit / 1048576)
          });
        }
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  // Log render for performance monitoring
  useEffect(() => {
    setPerformanceMetrics(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastRenderTime: Date.now()
    }));
  }, []);

  const handleClearCache = () => {
    try {
      localStorage.clear();
      if (dispatch) {
        dispatch({ type: 'CLEAR_NOTIFICATIONS' });
      }
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleExportState = () => {
    try {
      const stateData = {
        dashboard: state,
        dashboardType,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      const blob = new Blob([JSON.stringify(stateData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboardType}-dashboard-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export state:', error);
    }
  };

  const handleImportState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target?.result as string);
          console.log('Imported state:', importedState);
        } catch (error) {
          console.error('Failed to import state:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRefreshData = () => {
    if (dispatch) {
      dispatch({ type: 'SET_LOADING', payload: true });
      setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 1000);
    }
  };

  const handleTestNotification = () => {
    if (dispatch) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'info',
          title: 'Test Notification',
          message: `This is a test notification from ${dashboardType} dashboard`,
          duration: 5000
        }
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Dashboard Debug Panel
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Dashboard Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{dashboardType}</Badge>
              <span className="text-sm text-muted-foreground">Dashboard Type</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Connected</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Render Count:</span>
                  <span className="text-sm font-mono">{performanceMetrics.renderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Render:</span>
                  <span className="text-sm font-mono">{performanceMetrics.lastRenderTime}</span>
                </div>
              </div>
              {memoryUsage && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Used:</span>
                    <span className="text-sm font-mono">{memoryUsage.used} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Total:</span>
                    <span className="text-sm font-mono">{memoryUsage.total} MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* State Overview */}
          {state && (
            <div>
              <h3 className="text-lg font-semibold mb-3">State Overview</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={handleExportState}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefreshData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                <Bell className="h-4 w-4 mr-1" />
                Test Notification
              </Button>
            </div>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportState}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DebugToggleProps {
  dashboardType?: 'user' | 'therapist' | 'partner' | 'admin';
}

export function DebugToggle({ dashboardType = 'user' }: DebugToggleProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-40"
        onClick={() => setIsVisible(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>
      
      <DebugPanel
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        dashboardType={dashboardType}
      />
    </>
  );
}
