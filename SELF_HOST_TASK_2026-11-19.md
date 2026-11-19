# Self-host task — 2026-11-19

**Scope:** self-host only (`src/`, `self-host/`). No `crates/vue3d_core`. No UV desk / NURBS / LTM this set.

**Creative freedom** on structure if behaviour matches and paint latency does not regress.

## Export (new PBR package modes — export only)

| Mode | Outputs |
|------|---------|
| Classic multi-map | Separate albedo, roughness, metallic, normal… |
| RGB + ORM | Pure RGB albedo + ORM (R=AO, G=Rough, B=Metal) |
| RGB + ORM + AO×albedo | Albedo multiplied by AO + ORM |

Standard **image texture import** stays as today. Do not force ORM split on ordinary imports. Material/Auto-Texture may still group by role.

## Smart UV (simple)

Improve chart cuts + light relax/pack; planar fallback. Target channel write for seamless set.

## Layer UV

Wire `layer.uvChannel` through paint/composite/export. Default UV when unset.

## Seamless UV button (minimal)

Separate control; fills dedicated UV set 0–1 for tiling; selectable on layers/import.

## Bump / displacement

Merge via **Bump Levels** dialog; optional keep-colour.

## Desktop options bar scroll + UI scale %

Horizontal scroll mode (`flex-nowrap` + overflow-x). `uiScalePercent` decimals in Preferences.

## Gizmo → Preferences

- **Gizmo size** percent (50–200)
- Mountain GLB import in Preferences / quiet viewport (not a permanent overlay dialogue)
- **Auto-hide floating dialogs** when unfocused (Layer Filter, etc.)

## Layer multi-select

- Checkbox beside visibility
- Toolbar: Group / Delete selected
- Group rename (double-click)
- Long-press when 2+ selected: Group / Delete (merge / move-to-group can follow)

## Layer filters (implement priority)

### Hashing
| Param | Role | Range |
|-------|------|-------|
| hashSize | Cell size px | 2–64 |
| hashDensity | Activation % | 1–100 |
| hashSeed | Stable seed | 1–999 |
| hashAlgorithm | sparse / cell / grid-jitter | enum |

Plus existing angle/shift/randomization for active pixels.

### Other kinds
Hatching: spacing, angle, shift, width (bleed). Wood: keep object-space + stack. Powderiser: breakup, drift, angle. Dither: levels. Mosaic: block size. Noise-shader: darkness.

## Known code issues

ToolOptionsBar inner flex-wrap vs overflow-x. ExportTextureDialog needs ORM modes. Do not regress `uvGeometryVersion` destructuring.

## Verification

`npm run build` + `host:sync`. Hashing size/density visible. Gizmo size scales. Multi-select group works. Auto-hide filter on backdrop. CI ≠ device proof.
