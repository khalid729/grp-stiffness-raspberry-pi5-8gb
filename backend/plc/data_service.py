from typing import Dict, Any, Optional
from .connector import PLCConnector
import logging

logger = logging.getLogger(__name__)


class DataService:
    """Service for reading data from PLC via DB3

    DB3 - Status (Read):
    ┌─────────────────┬────────┬─────┬──────────────┐
    │ Signal          │ Byte   │ Bit │ DB Address   │
    ├─────────────────┼────────┼─────┼──────────────┤
    │ Servo_Ready     │ 0      │ 7   │ DB3.DBX0.7   │
    │ Servo_Error     │ 1      │ 0   │ DB3.DBX1.0   │
    │ At_Home         │ 1      │ 1   │ DB3.DBX1.1   │
    │ MC_Power        │ 20     │ 0   │ DB3.DBX20.0  │
    │ MC_Busy         │ 20     │ 1   │ DB3.DBX20.1  │
    │ MC_Error        │ 20     │ 2   │ DB3.DBX20.2  │
    │ Lock_Upper      │ 14     │ 0   │ DB3.DBX14.0  │
    │ Lock_Lower      │ 14     │ 1   │ DB3.DBX14.1  │
    │ Remote_Mode     │ 25     │ 0   │ DB3.DBX25.0  │
    │ Enable          │ 0      │ 0   │ DB3.DBX0.0   │
    └─────────────────┴────────┴─────┴──────────────┘

    DB3 - Real Values (Read):
    ┌─────────────────┬────────┬──────────────┐
    │ Value           │ Byte   │ DB Address   │
    ├─────────────────┼────────┼──────────────┤
    │ Actual_Position │ 2      │ DB3.DBD2     │
    │ Target_Position │ 6      │ DB3.DBD6     │
    │ Actual_Speed    │ 10     │ DB3.DBD10    │
    │ Jog_Velocity    │ 16     │ DB3.DBD16    │
    └─────────────────┴────────┴──────────────┘
    """

    DB_NUMBER = 3  # DB3 - Servo Control

    # ═══════════════════════════════════════════════════════════════════
    # STATUS - Bool values
    # ═══════════════════════════════════════════════════════════════════
    STATUS_ENABLE = (0, 0)        # DB3.DBX0.0 - Enable command
    STATUS_SERVO_READY = (0, 7)   # DB3.DBX0.7 - Servo ready
    STATUS_SERVO_ERROR = (1, 0)   # DB3.DBX1.0 - Servo error
    STATUS_AT_HOME = (1, 1)       # DB3.DBX1.1 - At home position
    STATUS_LOCK_UPPER = (14, 0)   # DB3.DBX14.0 - Upper clamp
    STATUS_LOCK_LOWER = (14, 1)   # DB3.DBX14.1 - Lower clamp
    STATUS_MC_POWER = (20, 0)     # DB3.DBX20.0 - MC Power status
    STATUS_MC_BUSY = (20, 1)      # DB3.DBX20.1 - MC Busy
    STATUS_MC_ERROR = (20, 2)     # DB3.DBX20.2 - MC Error
    STATUS_REMOTE_MODE = (25, 0)  # DB3.DBX25.0 - Remote mode
    STATUS_ESTOP_ACTIVE = (25, 1) # DB3.DBX25.1 - E-Stop latched state

    # ═══════════════════════════════════════════════════════════════════
    # REAL VALUES
    # ═══════════════════════════════════════════════════════════════════
    VAL_ACTUAL_POSITION = 2       # DB3.DBD2 - Actual position
    VAL_TARGET_POSITION = 6       # DB3.DBD6 - Target position
    VAL_ACTUAL_SPEED = 10         # DB3.DBD10 - Actual speed
    VAL_JOG_VELOCITY = 16         # DB3.DBD16 - Jog velocity

    # ═══════════════════════════════════════════════════════════════════
    # HARDWARE INPUTS (I Area) - Direct from sensors
    # ═══════════════════════════════════════════════════════════════════
    ANALOG_LOAD_CELL = 64         # IW64 - Load cell (0-27648 = 0-10V)

    # Load cell scaling
    LOAD_CELL_MAX_RAW = 27648
    LOAD_CELL_MAX_FORCE = 200.0   # kN

    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def _scale_load_cell(self, raw_value: int) -> float:
        """Scale raw analog value to kN"""
        if raw_value is None or raw_value < 0:
            return 0.0
        return (raw_value / self.LOAD_CELL_MAX_RAW) * self.LOAD_CELL_MAX_FORCE

    def get_live_data(self) -> Dict[str, Any]:
        """Read all real-time values from DB3"""
        if not self.plc.connected:
            return self._get_disconnected_data()

        try:
            # Read load cell
            load_cell_raw = self.plc.read_analog_input(self.ANALOG_LOAD_CELL) or 0
            actual_force = self._scale_load_cell(load_cell_raw)

            return {
                # ═══════════════════════════════════════════════════════════
                # STATUS from DB3
                # ═══════════════════════════════════════════════════════════
                "servo_ready": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_SERVO_READY) or False,
                "servo_error": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_SERVO_ERROR) or False,
                "servo_enabled": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_ENABLE) or False,
                "at_home": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_AT_HOME) or False,
                "lock_upper": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_LOCK_UPPER) or False,
                "lock_lower": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_LOCK_LOWER) or False,
                "remote_mode": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_REMOTE_MODE) or False,
                "mc_power": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_MC_POWER) or False,
                "mc_busy": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_MC_BUSY) or False,
                "mc_error": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_MC_ERROR) or False,
                "e_stop_active": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_ESTOP_ACTIVE) or False,

                # ═══════════════════════════════════════════════════════════
                # REAL VALUES from DB3
                # ═══════════════════════════════════════════════════════════
                "actual_position": self.plc.read_real(self.DB_NUMBER, self.VAL_ACTUAL_POSITION) or 0.0,
                "target_position": self.plc.read_real(self.DB_NUMBER, self.VAL_TARGET_POSITION) or 0.0,
                "actual_speed": self.plc.read_real(self.DB_NUMBER, self.VAL_ACTUAL_SPEED) or 0.0,
                "jog_velocity": self.plc.read_real(self.DB_NUMBER, self.VAL_JOG_VELOCITY) or 0.0,

                # ═══════════════════════════════════════════════════════════
                # ANALOG INPUT - Load Cell
                # ═══════════════════════════════════════════════════════════
                "load_cell_raw": load_cell_raw,
                "actual_force": actual_force,

                # ═══════════════════════════════════════════════════════════
                # CALCULATED / DEFAULTS
                # ═══════════════════════════════════════════════════════════
                "actual_deflection": 0.0,
                "target_deflection": 0.0,
                "ring_stiffness": 0.0,
                "force_at_target": 0.0,
                "sn_class": 0,
                "test_status": 0,
                "test_passed": False,

                # ═══════════════════════════════════════════════════════════
                # PLC STATUS
                # ═══════════════════════════════════════════════════════════
                "connected": True,
                "plc": {
                    "connected": True,
                    "cpu_state": self.plc.get_cpu_state(),
                    "ip": self.plc.ip
                }
            }
        except Exception as e:
            logger.error(f"Error reading live data: {e}")
            return self._get_disconnected_data()

    def _get_disconnected_data(self) -> Dict[str, Any]:
        """Default values when disconnected"""
        return {
            "servo_ready": False,
            "servo_error": False,
            "servo_enabled": False,
            "at_home": False,
            "lock_upper": False,
            "lock_lower": False,
            "remote_mode": False,
            "mc_power": False,
            "mc_busy": False,
            "mc_error": False,
            "e_stop_active": False,
            "actual_position": 0.0,
            "target_position": 0.0,
            "actual_speed": 0.0,
            "jog_velocity": 0.0,
            "load_cell_raw": 0,
            "actual_force": 0.0,
            "actual_deflection": 0.0,
            "target_deflection": 0.0,
            "ring_stiffness": 0.0,
            "force_at_target": 0.0,
            "sn_class": 0,
            "test_status": -1,
            "test_passed": False,
            "connected": False,
            "plc": {
                "connected": False,
                "cpu_state": "unknown",
                "ip": self.plc.ip
            }
        }

    def get_parameters(self) -> Dict[str, Any]:
        """Get test parameters"""
        return {
            "pipe_diameter": 0.0,
            "pipe_length": 0.0,
            "deflection_percent": 3.0,
            "test_speed": 50.0,
            "max_stroke": 100.0,
            "max_force": 200.0,
            "connected": self.plc.connected,
        }

    def set_parameters(self, **kwargs) -> bool:
        """Set test parameters"""
        logger.info(f"Parameters set: {kwargs}")
        return True

    def get_test_result(self) -> Dict[str, Any]:
        """Get test result"""
        return {
            "force_at_target": 0.0,
            "ring_stiffness": 0.0,
            "sn_class": 0,
            "test_passed": False,
            "target_deflection": 0.0,
        }
