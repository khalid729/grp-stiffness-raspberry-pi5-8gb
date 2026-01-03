import { useState, useEffect, useMemo } from 'react';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { MachineIndicator } from '@/components/dashboard/MachineIndicator';
import { TestStatusBadge } from '@/components/dashboard/TestStatusBadge';
import { ForceDeflectionChart } from '@/components/dashboard/ForceDeflectionChart';
import { ModeSelector } from '@/components/ModeSelector';
import { TouchButton } from '@/components/ui/TouchButton';
import { EStopButton } from '@/components/ui/EStopButton';
import { Gauge, Move, Target, Activity, Home, Play, Square } from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { useCommands, useModeControl } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const { liveData, isConnected } = useLiveData();
  const { startTest, stopTest, goHome } = useCommands();
  const { setMode } = useModeControl();

  // Chart data - accumulate from live data
  const [chartData, setChartData] = useState<{ deflection: number; force: number }[]>([]);

  // Mode state
  const isLocalMode = !liveData.remote_mode;
  const controlsDisabled = isLocalMode || !isConnected;
  const isTestRunning = liveData.test_status === 2;

  // Update chart data when testing
  useEffect(() => {
    if (liveData.test_status === 2) {
      setChartData(prev => {
        const lastPoint = prev[prev.length - 1];
        if (lastPoint &&
            Math.abs(lastPoint.deflection - liveData.actual_deflection) < 0.01) {
          return prev;
        }
        return [...prev, {
          deflection: liveData.actual_deflection,
          force: liveData.actual_force,
        }];
      });
    } else if (liveData.test_status === 1) {
      setChartData([]);
    }
  }, [liveData.actual_deflection, liveData.actual_force, liveData.test_status]);

  // Call real API to change mode in PLC
  const handleModeChange = (remoteMode: boolean) => {
    setMode.mutate(remoteMode);
  };

  const handleHome = () => {
    goHome.mutate();
  };

  const handleStartTest = () => {
    setChartData([]);
    startTest.mutate();
  };

  const handleStop = () => {
    stopTest.mutate();
  };

  const testStatus = liveData.test_status as 0 | 1 | 2 | 3 | 4 | 5 | -1;

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-bold">{t('nav.dashboard')}</h1>
          <TestStatusBadge status={testStatus} />
          {!isConnected && (
            <span className="connection-bar disconnected">
              <span className="w-2 h-2 rounded-full bg-current" />
              {t('connection.disconnected')}
            </span>
          )}
        </div>

        {/* Mode Selector - Compact */}
        <ModeSelector
          remoteMode={liveData.remote_mode}
          onModeChange={handleModeChange}
          isTestRunning={isTestRunning}
          variant="compact"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
          <TouchButton
            variant="outline"
            onClick={handleHome}
            disabled={controlsDisabled || goHome.isPending}
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            {t('actions.home')}
          </TouchButton>
          <TouchButton
            variant="success"
            onClick={handleStartTest}
            disabled={controlsDisabled || !liveData.servo_ready || liveData.servo_error || isTestRunning || startTest.isPending}
            className="gap-2"
          >
            <Play className="w-5 h-5" />
            {t('actions.start')}
          </TouchButton>
          <TouchButton
            variant="destructive"
            onClick={handleStop}
            disabled={controlsDisabled || stopTest.isPending}
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            {t('actions.stop')}
          </TouchButton>
        </div>
        
        {/* Separator */}
        <div className="hidden md:flex items-center h-16 px-2">
          <div className="w-px h-full bg-border/50"></div>
        </div>
        
        {/* E-Stop - Isolated Emergency Control */}
        <div className="flex-shrink-0 p-2 rounded-xl bg-destructive/5 border border-destructive/20">
          <EStopButton 
            size="md"
            label={t('actions.eStop')}
            onClick={handleStop}
          />
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="status-grid">
        <StatusCard
          title={t('dashboard.force')}
          value={liveData.actual_force.toFixed(2)}
          unit="kN"
          icon={<Gauge className="w-5 h-5" />}
          variant="info"
        />
        <StatusCard
          title={t('dashboard.deflection')}
          value={liveData.actual_deflection.toFixed(2)}
          unit="mm"
          icon={<Move className="w-5 h-5" />}
          variant="warning"
        />
        <StatusCard
          title={t('dashboard.position')}
          value={liveData.actual_position.toFixed(2)}
          unit="mm"
          icon={<Target className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.status')}
          value={t(`status.${['idle', 'starting', 'testing', 'atTarget', 'returning', 'complete'][liveData.test_status] || 'error'}`)}
          icon={<Activity className="w-5 h-5" />}
          variant={liveData.test_status === 2 ? 'warning' : liveData.test_status === 5 ? 'success' : 'default'}
        />
      </div>

      {/* Chart Section */}
      <div className="chart-container relative">
        <ForceDeflectionChart
          data={chartData}
          targetDeflection={liveData.target_deflection}
        />
      </div>

      {/* Machine Indicators */}
      <div className="industrial-card p-4">
        <h3 className="text-sm lg:text-base font-semibold mb-3 text-muted-foreground">
          {t('dashboard.machineIndicators')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MachineIndicator
            label={t('dashboard.servoReady')}
            isActive={liveData.servo_ready}
          />
          <MachineIndicator
            label={t('dashboard.servoError')}
            isActive={liveData.servo_error}
            isError={liveData.servo_error}
          />
          <MachineIndicator
            label={t('dashboard.upperLock')}
            isActive={liveData.lock_upper}
          />
          <MachineIndicator
            label={t('dashboard.lowerLock')}
            isActive={liveData.lock_lower}
          />
          <MachineIndicator
            label={t('dashboard.atHome')}
            isActive={liveData.at_home}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
