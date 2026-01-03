import time
import logging
from .connector import PLCConnector

logger = logging.getLogger(__name__)


class CommandService:
    """Service for sending commands to PLC via DB3

    DB3 - Servo Control Data Block:
    ┌─────────────────┬────────┬─────┬──────────────┐
    │ Function        │ Byte   │ Bit │ DB Address   │
    ├─────────────────┼────────┼─────┼──────────────┤
    │ Enable          │ 0      │ 0   │ DB3.DBX0.0   │
    │ Jog_Forward     │ 0      │ 1   │ DB3.DBX0.1   │
    │ Jog_Backward    │ 0      │ 2   │ DB3.DBX0.2   │
    │ Start_Test      │ 0      │ 3   │ DB3.DBX0.3   │
    │ Stop            │ 0      │ 4   │ DB3.DBX0.4   │
    │ Reset           │ 0      │ 5   │ DB3.DBX0.5   │
    │ Home            │ 0      │ 6   │ DB3.DBX0.6   │
    │ Lock_Upper      │ 14     │ 0   │ DB3.DBX14.0  │
    │ Lock_Lower      │ 14     │ 1   │ DB3.DBX14.1  │
    │ Remote_Mode     │ 25     │ 0   │ DB3.DBX25.0  │
    │ Jog_Velocity    │ 16     │ -   │ DB3.DBD16    │
    └─────────────────┴────────┴─────┴──────────────┘
    """

    DB_NUMBER = 3  # DB3 - Servo Control

    # ═══════════════════════════════════════════════════════════════════
    # COMMANDS (Byte 0) - Main control bits
    # ═══════════════════════════════════════════════════════════════════
    CMD_ENABLE = (0, 0)         # DB3.DBX0.0 - Enable Servo
    CMD_JOG_FORWARD = (0, 1)    # DB3.DBX0.1 - Jog Forward
    CMD_JOG_BACKWARD = (0, 2)   # DB3.DBX0.2 - Jog Backward
    CMD_START_TEST = (0, 3)     # DB3.DBX0.3 - Start Test
    CMD_STOP = (0, 4)           # DB3.DBX0.4 - Stop
    CMD_RESET = (0, 5)          # DB3.DBX0.5 - Reset
    CMD_HOME = (0, 6)           # DB3.DBX0.6 - Home

    # ═══════════════════════════════════════════════════════════════════
    # CLAMPS (Byte 14) - Lock control bits
    # ═══════════════════════════════════════════════════════════════════
    CMD_LOCK_UPPER = (14, 0)    # DB3.DBX14.0 - Lock Upper Clamp
    CMD_LOCK_LOWER = (14, 1)    # DB3.DBX14.1 - Lock Lower Clamp

    # ═══════════════════════════════════════════════════════════════════
    # MODE (Byte 25)
    # ═══════════════════════════════════════════════════════════════════
    CMD_REMOTE_MODE = (25, 0)   # DB3.DBX25.0 - Remote Mode

    # ═══════════════════════════════════════════════════════════════════
    # REAL VALUES
    # ═══════════════════════════════════════════════════════════════════
    CMD_JOG_VELOCITY = 16       # DB3.DBD16 - Jog Speed (Real)

    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def _check_connection(self) -> bool:
        """Check PLC connection before command"""
        if not self.plc.connected:
            logger.warning("Cannot execute command: PLC not connected")
            return False
        return True

    # ========== Servo Control ==========

    def enable_servo(self) -> bool:
        """Enable servo motor - DB3.DBX0.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_ENABLE, True)
        logger.info("Servo enabled (DB3.DBX0.0 = True)")
        return result

    def disable_servo(self) -> bool:
        """Disable servo motor - DB3.DBX0.0"""
        if not self._check_connection():
            return False
        self.stop_all_jog()
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_ENABLE, False)
        logger.info("Servo disabled (DB3.DBX0.0 = False)")
        return result

    def reset_alarm(self) -> bool:
        """Reset servo alarm - DB3.DBX0.5 (pulse)"""
        if not self._check_connection():
            return False
        self.plc.write_bool(self.DB_NUMBER, *self.CMD_RESET, True)
        time.sleep(0.5)
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_RESET, False)
        logger.info("Alarm reset (DB3.DBX0.5 pulse)")
        return result

    # ========== Jog Control ==========

    def jog_forward(self, state: bool) -> bool:
        """Jog forward - DB3.DBX0.1"""
        if not self._check_connection():
            return False
        if state:
            self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_BACKWARD, False)
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_FORWARD, state)
        logger.info(f"Jog forward: {state} (DB3.DBX0.1)")
        return result

    def jog_backward(self, state: bool) -> bool:
        """Jog backward - DB3.DBX0.2"""
        if not self._check_connection():
            return False
        if state:
            self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_FORWARD, False)
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_BACKWARD, state)
        logger.info(f"Jog backward: {state} (DB3.DBX0.2)")
        return result

    def set_jog_velocity(self, velocity: float) -> bool:
        """Set jog speed - DB3.DBD16 (mm/min)"""
        if not self._check_connection():
            return False
        velocity = max(1.0, min(100.0, velocity))
        result = self.plc.write_real(self.DB_NUMBER, self.CMD_JOG_VELOCITY, velocity)
        logger.info(f"Jog velocity: {velocity} mm/min (DB3.DBD16)")
        return result

    def stop_all_jog(self) -> bool:
        """Stop all jog movements"""
        if not self._check_connection():
            return False
        success = True
        success &= self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_FORWARD, False)
        success &= self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_BACKWARD, False)
        logger.info("All jog stopped")
        return success

    # ========== Clamp Control ==========

    def lock_upper(self) -> bool:
        """Lock upper clamp - DB3.DBX14.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_LOCK_UPPER, True)
        logger.info("Upper clamp locked (DB3.DBX14.0 = True)")
        return result

    def lock_lower(self) -> bool:
        """Lock lower clamp - DB3.DBX14.1"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_LOCK_LOWER, True)
        logger.info("Lower clamp locked (DB3.DBX14.1 = True)")
        return result

    def unlock_upper(self) -> bool:
        """Unlock upper clamp - DB3.DBX14.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_LOCK_UPPER, False)
        logger.info("Upper clamp unlocked (DB3.DBX14.0 = False)")
        return result

    def unlock_lower(self) -> bool:
        """Unlock lower clamp - DB3.DBX14.1"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_LOCK_LOWER, False)
        logger.info("Lower clamp unlocked (DB3.DBX14.1 = False)")
        return result

    def unlock_all(self) -> bool:
        """Unlock all clamps"""
        success = self.unlock_upper() and self.unlock_lower()
        logger.info("All clamps unlocked")
        return success

    # ========== Test Control ==========

    def start_test(self) -> bool:
        """Start test - DB3.DBX0.3"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_START_TEST, True)
        logger.info("Test started (DB3.DBX0.3 = True)")
        return result

    def stop(self) -> bool:
        """Emergency stop - DB3.DBX0.4"""
        if not self._check_connection():
            return False
        self.stop_all_jog()
        self.plc.write_bool(self.DB_NUMBER, *self.CMD_STOP, True)
        time.sleep(0.1)
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_STOP, False)
        logger.warning("STOP executed (DB3.DBX0.4)")
        return result

    def home(self) -> bool:
        """Go home - DB3.DBX0.6"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_HOME, True)
        logger.info("Homing started (DB3.DBX0.6 = True)")
        return result

    # ========== Mode Control ==========

    def set_remote_mode(self, is_remote: bool) -> bool:
        """Set remote mode - DB3.DBX25.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_NUMBER, *self.CMD_REMOTE_MODE, is_remote)
        mode = "Remote" if is_remote else "Local"
        logger.info(f"Mode: {mode} (DB3.DBX25.0 = {is_remote})")
        return result

    def get_remote_mode(self) -> bool:
        """Get remote mode - DB3.DBX25.0"""
        if not self.plc.connected:
            return False
        return self.plc.read_bool(self.DB_NUMBER, *self.CMD_REMOTE_MODE) or False
