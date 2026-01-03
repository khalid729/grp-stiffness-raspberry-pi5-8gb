import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/api/socket';
import type { LiveData } from '@/types/api';

const defaultLiveData: LiveData = {
  actual_force: 0,
  actual_deflection: 0,
  target_deflection: 0,
  ring_stiffness: 0,
  force_at_target: 0,
  sn_class: 0,
  test_status: -1, // -1 = disconnected
  test_passed: false,
  servo_ready: false,
  servo_error: false,
  at_home: false,
  upper_limit: false,
  lower_limit: false,
  e_stop: false,
  start_button: false,
  load_cell_raw: 0,
  actual_position: 0,
  lock_upper: false,
  lock_lower: false,
  remote_mode: false,
  connected: false,
};

// Real live data from WebSocket
export function useLiveData() {
  const [liveData, setLiveData] = useState<LiveData>(defaultLiveData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    socketClient.connect();
    setIsConnected(socketClient.isConnected);

    // Subscribe to live data
    const unsubscribeLiveData = socketClient.on<LiveData>('live_data', (data) => {
      setLiveData(data);
      setIsConnected(data.connected);
    });

    const unsubscribeConnection = socketClient.on<{ connected: boolean }>(
      'connection_status',
      (data) => {
        setIsConnected(data.connected);
      }
    );

    // Cleanup
    return () => {
      unsubscribeLiveData();
      unsubscribeConnection();
    };
  }, []);

  const setRemoteMode = useCallback((mode: boolean) => {
    setLiveData(prev => ({ ...prev, remote_mode: mode }));
  }, []);

  return { liveData, isConnected, setRemoteMode };
}

// Jog control via WebSocket for real-time response
export function useJogControl() {
  const jogForward = useCallback((pressed: boolean) => {
    socketClient.jogForward(pressed);
  }, []);

  const jogBackward = useCallback((pressed: boolean) => {
    socketClient.jogBackward(pressed);
  }, []);

  const setJogSpeed = useCallback((speed: number) => {
    socketClient.setJogSpeed(speed);
  }, []);

  return { jogForward, jogBackward, setJogSpeed };
}

// Test status helper
export function useTestStatus() {
  const { liveData, isConnected } = useLiveData();

  const statusMap: Record<number, string> = {
    [-1]: 'disconnected',
    0: 'idle',
    1: 'starting',
    2: 'testing',
    3: 'atTarget',
    4: 'returning',
    5: 'complete',
  };

  return {
    status: statusMap[liveData.test_status] || 'unknown',
    statusCode: liveData.test_status,
    isConnected,
    isRunning: liveData.test_status === 2,
    isComplete: liveData.test_status === 5,
  };
}
