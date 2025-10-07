'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface RealTimeStatusProps {
  realTimeUpdates?: number;
  isOnline?: boolean;
  className?: string;
  showUpdateCount?: boolean;
}

export function RealTimeStatus({ 
  realTimeUpdates = 0, 
  isOnline = true, 
  className = "",
  showUpdateCount = true 
}: RealTimeStatusProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Update last update time every 30 seconds when online
    const interval = setInterval(() => {
      if (isOnline) {
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Online/Offline Status */}
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`}></div>
      
      <span className={`text-sm font-medium ${
        isOnline ? 'text-green-600' : 'text-red-600'
      }`}>
        {isOnline ? 'Live' : 'Offline'}
      </span>

      {/* Update Count Badge */}
      {showUpdateCount && realTimeUpdates > 0 && (
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
          {realTimeUpdates} update{realTimeUpdates !== 1 ? 's' : ''}
        </Badge>
      )}

      {/* Last Update Time */}
      <span className="text-xs text-muted-foreground">
        Updated: {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactRealTimeStatus({ 
  realTimeUpdates = 0, 
  isOnline = true 
}: RealTimeStatusProps) {
  return (
    <div className="flex items-center space-x-1">
      <div className={`w-1.5 h-1.5 rounded-full ${
        isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`}></div>
      <span className={`text-xs ${
        isOnline ? 'text-green-600' : 'text-red-600'
      }`}>
        {isOnline ? 'Live' : 'Off'}
      </span>
      {realTimeUpdates > 0 && (
        <span className="text-xs text-blue-600 font-medium">
          +{realTimeUpdates}
        </span>
      )}
    </div>
  );
}

// Detailed version with more information
export function DetailedRealTimeStatus({ 
  realTimeUpdates = 0, 
  isOnline = true 
}: RealTimeStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');

  useEffect(() => {
    // Simulate connection quality based on online status
    if (!isOnline) {
      setConnectionStatus('offline');
    } else {
      // In a real app, you'd measure actual connection quality
      setConnectionStatus('excellent');
    }
  }, [isOnline]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'excellent': return 'Excellent Connection';
      case 'good': return 'Good Connection';
      case 'poor': return 'Poor Connection';
      case 'offline': return 'No Connection';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Real-time Updates */}
      {showUpdateCount !== undefined && showUpdateCount && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-muted-foreground">Updates:</span>
          <Badge variant="outline" className="text-xs">
            {realTimeUpdates}
          </Badge>
        </div>
      )}

      {/* Last Sync */}
      <div className="text-xs text-muted-foreground">
        Last sync: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
