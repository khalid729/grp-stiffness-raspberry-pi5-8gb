import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CommandResponse, ModeResponse } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Real API call helper
const apiCall = async (endpoint: string, options?: RequestInit): Promise<CommandResponse> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};

// ========== Commands ==========

export function useCommands() {
  const startTest = useMutation({
    mutationFn: () => apiCall('/api/command/start', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to start test: ${error.message}`);
    },
  });

  const stopTest = useMutation({
    mutationFn: () => apiCall('/api/command/stop', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to stop test: ${error.message}`);
    },
  });

  const goHome = useMutation({
    mutationFn: () => apiCall('/api/command/home', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to go home: ${error.message}`);
    },
  });

  return { startTest, stopTest, goHome };
}

// ========== Servo ==========

export function useServoControl() {
  const enableServo = useMutation({
    mutationFn: () => apiCall('/api/servo/enable', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to enable servo: ${error.message}`);
    },
  });

  const disableServo = useMutation({
    mutationFn: () => apiCall('/api/servo/disable', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to disable servo: ${error.message}`);
    },
  });

  const resetAlarm = useMutation({
    mutationFn: () => apiCall('/api/servo/reset', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to reset alarm: ${error.message}`);
    },
  });

  return { enableServo, disableServo, resetAlarm };
}

// ========== Clamps ==========

export function useClampControl() {
  const lockUpper = useMutation({
    mutationFn: () => apiCall('/api/clamp/upper/lock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to lock upper clamp: ${error.message}`);
    },
  });

  const lockLower = useMutation({
    mutationFn: () => apiCall('/api/clamp/lower/lock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to lock lower clamp: ${error.message}`);
    },
  });

  const unlockAll = useMutation({
    mutationFn: () => apiCall('/api/clamp/unlock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to unlock clamps: ${error.message}`);
    },
  });

  return { lockUpper, lockLower, unlockAll };
}

// ========== Mode Control ==========

export function useModeControl() {
  const queryClient = useQueryClient();

  const modeQuery = useQuery<ModeResponse>({
    queryKey: ['mode'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/mode`);
      if (!response.ok) throw new Error('Failed to fetch mode');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const setMode = useMutation({
    mutationFn: async (remoteMode: boolean) => {
      const endpoint = remoteMode ? '/api/mode/remote' : '/api/mode/local';
      return apiCall(endpoint, { method: 'POST' });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['mode'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to change mode: ${error.message}`);
    },
  });

  return {
    setMode,
    currentMode: modeQuery.data,
    isLoading: modeQuery.isLoading,
  };
}

// ========== Jog Control ==========

export function useJogApi() {
  const setJogSpeed = useMutation({
    mutationFn: (velocity: number) =>
      apiCall('/api/jog/speed', {
        method: 'POST',
        body: JSON.stringify({ velocity }),
      }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to set jog speed: ${error.message}`);
    },
  });

  return { setJogSpeed };
}
