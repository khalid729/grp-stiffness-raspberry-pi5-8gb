import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/api/socket';
import type { LiveData, TEST_STAGE_NAMES } from '@/types/api';

const defaultLiveData: LiveData = {
  // Structured data
  force: { raw: 0, actual: 0, filtered: 0, kN: 0, N: 0 },
  position: { raw: 0, actual: 0, servo: 0, target: 0 },
  deflection: { actual: 0, percent: 0, target: 0 },
  test: { status: -1, stage: 0, progress: 0, recording: false, preload_reached: false, passed: false },
  results: { ring_stiffness: 0, force_at_target: 0, sn_class: 0, contact_position: 0, data_points: 0 },
  servo: { ready: false, error: false, enabled: false, at_home: false, mc_power: false, mc_busy: false, mc_error: false, speed: 0, jog_velocity: 0 },
  safety: { e_stop: false, upper_limit: false, lower_limit: false, home: false, ok: false, motion_allowed: false },
  clamps: { upper: false, lower: false },
  mode: { remote: false, can_change: false },
  alarm: { active: false, code: 0 },
  lamps: { ready: false, running: false, error: false },
  plc: { connected: false, cpu_state: 'unknown', ip: '' },
  connected: false,
  
  // Legacy flat fields
  actual_force: 0,
  actual_deflection: 0,
  target_deflection: 0,
  actual_position: 0,
  test_status: -1,
  test_progress: 0,
  servo_ready: false,
  servo_error: false,
  servo_enabled: false,
  at_home: false,
  lock_upper: false,
  lock_lower: false,
  remote_mode: false,
  e_stop_active: false,
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

// Test stage names matching new FC2 state machine (manual contact)
const stageNames: Record<number, string> = {
  0: 'Idle - Ready',
  1: 'Initializing...',
  2: 'Zeroing Position...',
  3: 'Testing in Progress...',
  4: 'Recording Results...',
  5: 'Returning to Contact...',
  6: 'Test Complete',
  99: 'ERROR - Check Alarm',
};

// Test status helper
export function useTestStatus() {
  const { liveData, isConnected } = useLiveData();

  const statusMap: Record<number, string> = {
    [-1]: 'disconnected',
    0: 'idle',
    1: 'initializing',
    2: 'zeroing',
    3: 'testing',
    4: 'recording',
    5: 'returning',
    6: 'complete',
    99: 'error',
  };

  const testStage = liveData.test?.stage ?? 0;
  const testProgress = liveData.test?.progress ?? liveData.test_progress ?? 0;

  return {
    status: statusMap[liveData.test_status] || 'unknown',
    statusCode: liveData.test_status,
    stage: testStage,
    stageName: stageNames[testStage] || 'Unknown',
    progress: testProgress,
    isConnected,
    isRunning: testStage >= 1 && testStage <= 5,
    isComplete: testStage === 6,
  };
}
