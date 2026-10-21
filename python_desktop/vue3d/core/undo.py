"""
Normalized Undo/Redo Engine for VUE 3D Canvas (Python Edition)
Author: Victory Ukpong
Constraint: Strictly 3 states persisted to .xblend file, normal 1-step undo in live session.
"""

import time
import copy
from typing import List, Dict, Any, Optional
import numpy as np
from .types import Layer

class UndoRingBuffer:
    DEFAULT_RUNTIME_STATES = 30
    XBLEND_SAVE_STATES = 3

    def __init__(self, max_runtime_states: int = 30):
        self.max_states = max_runtime_states
        self.stack: List[Dict[str, Any]] = []
        self.current_index = -1

    def push_state(self, description: str, layers: List[Layer]):
        # Truncate future tree if branched
        if self.current_index < len(self.stack) - 1:
            self.stack = self.stack[:self.current_index + 1]

        snapshot_layers = []
        for l in layers:
            snapshot_layers.append({
                "id": l.id,
                "name": l.name,
                "pixels": np.copy(l.pixels),
                "opacity": l.opacity,
                "visible": l.visible,
                "locked": l.locked,
                "blend_mode": l.blend_mode,
            })

        snap = {
            "timestamp": int(time.time()),
            "description": description,
            "layers": snapshot_layers
        }

        self.stack.append(snap)
        self.current_index = len(self.stack) - 1

        if len(self.stack) > self.max_states:
            self.stack.pop(0)
            self.current_index -= 1

    def can_undo(self) -> bool:
        return self.current_index > 0

    def can_redo(self) -> bool:
        return self.current_index < len(self.stack) - 1

    def undo(self, layers: List[Layer]) -> bool:
        if not self.can_undo():
            return False
        self.current_index -= 1
        self._apply_snapshot(self.stack[self.current_index], layers)
        return True

    def redo(self, layers: List[Layer]) -> bool:
        if not self.can_redo():
            return False
        self.current_index += 1
        self._apply_snapshot(self.stack[self.current_index], layers)
        return True

    def _apply_snapshot(self, snap: Dict[str, Any], layers: List[Layer]):
        snap_map = {ld["id"]: ld for ld in snap["layers"]}
        for l in layers:
            if l.id in snap_map:
                s = snap_map[l.id]
                np.copyto(l.pixels, s["pixels"])
                l.opacity = s["opacity"]
                l.visible = s["visible"]
                l.locked = s["locked"]
                l.blend_mode = s["blend_mode"]

    def get_xblend_save_states(self) -> List[Dict[str, Any]]:
        """Strictly extracts at most 3 states for saving to .xblend."""
        if not self.stack:
            return []
        end = self.current_index if self.current_index >= 0 else len(self.stack) - 1
        start = max(0, end - (self.XBLEND_SAVE_STATES - 1))
        chosen = self.stack[start:end + 1]
        return [
            {
                "slotIndex": i,
                "description": s["description"],
                "timestamp": s["timestamp"]
            }
            for i, s in enumerate(chosen)
        ]
