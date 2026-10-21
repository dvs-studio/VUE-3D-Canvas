"""
.xblend Project Serialization & Deserialization (Python Edition)
Author: Victory Ukpong
Constraint: Strictly 3 states saved to .xblend file, linked 3D assets default.
"""

import json
import base64
import os
from typing import List, Dict, Any, Optional
from .compat import np
from .types import Layer, ThemeMode
from .undo import UndoRingBuffer

class XBlendManager:
    FORMAT_VERSION = "0.1.0"

    @classmethod
    def save(cls, filepath: str, layers: List[Layer], undo_buffer: UndoRingBuffer, model_name: str = "builtin:suzanne", theme: ThemeMode = ThemeMode.CS5) -> bool:
        try:
            save_states = undo_buffer.get_xblend_save_states()
            doc: Dict[str, Any] = {
                "format": "XBLEND",
                "version": cls.FORMAT_VERSION,
                "author": "Victory Ukpong",
                "model": model_name,
                "theme": theme.value,
                "undoStateCount": len(save_states),
                "undoStates": save_states,
                "layers": []
            }

            for l in layers:
                raw_bytes = l.pixels.tobytes()
                b64 = base64.b64encode(raw_bytes).decode('ascii')
                doc["layers"].append({
                    "id": l.id,
                    "name": l.name,
                    "width": l.width,
                    "height": l.height,
                    "opacity": l.opacity,
                    "visible": l.visible,
                    "locked": l.locked,
                    "blend_mode": l.blend_mode,
                    "payload_base64": b64
                })

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(doc, f, indent=2)
            return True
        except Exception as e:
            print(f"[XBlendManager] Error saving {filepath}: {e}")
            return False

    @classmethod
    def load(cls, filepath: str) -> Optional[Dict[str, Any]]:
        try:
            if not os.path.exists(filepath):
                return None
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[XBlendManager] Error loading {filepath}: {e}")
            return None
