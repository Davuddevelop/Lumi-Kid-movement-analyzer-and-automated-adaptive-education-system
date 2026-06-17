"""
Lumi ESP32 WebSocket Bridge
Manages bidirectional WebSocket connections from ESP32 robots.
Replaces the legacy serial-based robot_controller.py.
"""
import asyncio
import json
import logging
from typing import Dict, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ESP32RobotBridge:
    """Manages bidirectional WebSocket connections from ESP32 robots."""

    def __init__(self):
        self.robots: Dict[str, WebSocket] = {}
        self.telemetry: Dict[str, dict] = {}
        self._pending: Dict[str, asyncio.Future] = {}

    async def register(self, robot_id: str, ws: WebSocket):
        self.robots[robot_id] = ws
        logger.info(f"Robot connected: {robot_id}")

    async def unregister(self, robot_id: str):
        self.robots.pop(robot_id, None)
        self.telemetry.pop(robot_id, None)
        fut = self._pending.pop(robot_id, None)
        if fut and not fut.done():
            fut.set_result(False)
        logger.info(f"Robot disconnected: {robot_id}")

    def is_connected(self, robot_id: str) -> bool:
        return robot_id in self.robots

    def list_robots(self) -> list:
        return list(self.robots.keys())

    async def _send(self, robot_id: str, payload: dict) -> bool:
        ws = self.robots.get(robot_id)
        if not ws:
            logger.info(f"[SIM] Robot {robot_id} not connected — simulating")
            return True
        try:
            await ws.send_json(payload)
            return True
        except Exception as e:
            logger.error(f"Send error to {robot_id}: {e}")
            await self.unregister(robot_id)
            return False

    async def execute_sequence(self, robot_id: str, commands: list) -> bool:
        """Send execute command and wait for completion (max 30s)."""
        if not self.is_connected(robot_id):
            await asyncio.sleep(len(commands) * 0.6)  # simulate timing
            return True

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        self._pending[robot_id] = fut

        await self._send(robot_id, {"type": "execute", "commands": commands})

        try:
            result = await asyncio.wait_for(fut, timeout=30.0)
            return result
        except asyncio.TimeoutError:
            logger.warning(f"Execution timeout for {robot_id}")
            return False
        finally:
            self._pending.pop(robot_id, None)

    async def celebrate(self, robot_id: str):
        await self._send(robot_id, {"type": "celebrate"})

    async def emergency_stop(self, robot_id: str):
        await self._send(robot_id, {"type": "stop"})

    async def set_leds(self, robot_id: str, r: int, g: int, b: int):
        await self._send(robot_id, {"type": "set_leds", "r": r, "g": g, "b": b})

    async def set_led_emotion(self, robot_id: str, emotion: str):
        """Map emotion to LED color."""
        colors = {
            "joy":         (0, 255, 100),
            "frustration": (255, 50, 0),
            "confusion":   (255, 200, 0),
            "curiosity":   (0, 150, 255),
            "neutral":     (100, 0, 255),
        }
        r, g, b = colors.get(emotion, (100, 0, 255))
        await self.set_leds(robot_id, r, g, b)

    def handle_message(self, robot_id: str, data: dict):
        msg_type = data.get("type")
        if msg_type == "telemetry":
            self.telemetry[robot_id] = data
        elif msg_type == "execution_complete":
            fut = self._pending.get(robot_id)
            if fut and not fut.done():
                fut.set_result(data.get("success", True))
        elif msg_type == "collision":
            fut = self._pending.get(robot_id)
            if fut and not fut.done():
                fut.set_result(False)

    def get_telemetry(self, robot_id: str) -> dict:
        return self.telemetry.get(robot_id, {})


# Global singleton
robot_bridge = ESP32RobotBridge()
