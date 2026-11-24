# UI1 — Window panel persistence — 2026-11-24

## Scope
Self-hosted TypeScript application only. No Rust core, OBJ asset, safety archive or built-in triplanar sample was changed.

## Implementation
In `src/App.tsx`:
- Window-menu panel visibility is restored from `localStorage.vue3d_panel_visibility`.
- Floating/docked panel state is restored from `localStorage.vue3d_panel_floating`.
- Restoration merges only known panel keys and accepts only boolean values. Unknown keys are ignored so new panels keep their current defaults.
- Malformed JSON falls back to defaults.
- Changes are persisted by guarded effects. Storage quota/security errors are logged as warnings and do not block rendering.
- Existing Window menu toggles and panel close/float actions remain unchanged.

## Acceptance checks
1. Toggle several entries in Window, reload, and confirm the same entries remain enabled/disabled.
2. Float a supported panel, reload, and confirm its floating/docked state is restored.
3. Add an unknown key or malformed value to either storage object and confirm startup still succeeds and defaults are retained for invalid entries.
4. Test normal HTTP hosting and `file://` where supported by the target browser. Browser storage policies can differ by origin and file URL.

## Verification boundary
The source change is committed to `main`. Run #285 passed TypeScript diagnostics, Vite build, self-host synchronisation, package validation, generated-output commit, ZIP creation and artifact upload. Artifact ID: `14921232460`. Persistence across actual browser restarts remains a manual acceptance test.