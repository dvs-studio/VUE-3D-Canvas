"""
Pure Python Compatibility Shim for NumPy-free Environments
Author: Victory Ukpong
Allows VUE 3D Canvas Python Edition to run out-of-the-box on vanilla Python 3.9+ without pip installs.
"""

import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

    class _PureArray(list):
        def __init__(self, data=None, shape=None):
            if data is not None:
                super().__init__(data)
            else:
                super().__init__()
            self._shape = shape or (len(self),)

        @property
        def shape(self):
            return self._shape

        def tobytes(self):
            # Flatten to bytes
            flat = []
            def _flatten(x):
                if isinstance(x, (list, _PureArray)):
                    for item in x: _flatten(item)
                else:
                    flat.append(int(x) & 0xFF)
            _flatten(self)
            return bytes(flat)

        def astype(self, dtype):
            return self

    class _NumPyShim:
        ndarray = _PureArray
        uint8 = int
        float32 = float
        uint32 = int
        pi = math.pi

        @staticmethod
        def array(data, dtype=None):
            if isinstance(data, (list, tuple)):
                return _PureArray(data)
            return data

        @staticmethod
        def full(shape, fill_value, dtype=None):
            if isinstance(shape, int):
                return _PureArray([fill_value] * shape, shape=(shape,))
            if len(shape) == 3:
                h, w, c = shape
                row = [[fill_value] * c for _ in range(w)]
                grid = [list(row) for _ in range(h)]
                return _PureArray(grid, shape=shape)
            elif len(shape) == 2:
                h, w = shape
                return _PureArray([[fill_value] * w for _ in range(h)], shape=shape)
            return _PureArray([fill_value] * shape[0], shape=shape)

        @staticmethod
        def zeros(shape, dtype=None):
            return _NumPyShim.full(shape, 0, dtype)

        @staticmethod
        def zeros_like(a):
            return _NumPyShim.zeros(getattr(a, 'shape', (len(a),)))

        @staticmethod
        def ones_like(a):
            return _NumPyShim.full(getattr(a, 'shape', (len(a),)), 1)

        @staticmethod
        def sin(x):
            return math.sin(x) if isinstance(x, (int, float)) else [_NumPyShim.sin(v) for v in x]

        @staticmethod
        def cos(x):
            return math.cos(x) if isinstance(x, (int, float)) else [_NumPyShim.cos(v) for v in x]

        @staticmethod
        def exp(x):
            return math.exp(x)

        @staticmethod
        def hypot(x, y):
            return math.hypot(x, y)

        @staticmethod
        def arctan2(y, x):
            return math.atan2(y, x)

        @staticmethod
        def clip(val, a_min, a_max):
            return max(a_min, min(a_max, val))

        @staticmethod
        def copy(arr):
            import copy
            return copy.deepcopy(arr)

        @staticmethod
        def copyto(dst, src):
            if isinstance(dst, list) and isinstance(src, list):
                dst.clear()
                dst.extend(src)

        class linalg:
            @staticmethod
            def norm(x, axis=None, keepdims=False):
                if isinstance(x, (list, tuple)):
                    val = math.sqrt(sum(v * v for v in x))
                    return val if not keepdims else [val]
                return abs(x)

    np = _NumPyShim()
