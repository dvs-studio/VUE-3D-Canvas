# World-space Base Layer checker — 2026-11-24

## Behaviour contract

The protected Base Layer is a procedural world-space background, not a UV paint canvas and not a conventional colour coat.

- It renders behind the colour texture using world position and a surface-normal-selected world-axis projection in the 3D material shader, so differently oriented faces use a suitable world-space plane.
- The UV composite remains transparent where no paint exists. The Base Layer is excluded from UV compositing and texture export.
- Checker colours A and B default to the same neutral grey (`#9c9c9c`), each at 100% opacity.
- Each checker colour has its own opacity control. These values are session-only and reset to 100% when another project is loaded or the application starts.
- The Base Layer's main layer opacity is independent and is controlled by the normal Layers-panel opacity slider.
- Editing is live in the current session. Cancel closes the dialog without rolling back the current colour setup and without saving colour preferences.
- Save persists only colour A and colour B in `localStorage`; neither checker-colour opacity nor overall Base Layer opacity is persisted as a global preference.
- Reset restores both colours to `#9c9c9c`, both colour opacities to 100%, and overall Base Layer opacity to 100%.
- The Reset action is available in the properties dialog and as the button in the Base Layer's usual multi-select checkbox position.
- The Base Layer remains locked against painting and protected from visibility, stack, duplicate, delete, group, and merge operations.

## Facility bookmark / code map

Use these paths and symbols as direct navigation points:

| Facility | File | Symbol / anchor |
|---|---|---|
| Base settings data contract | `src/core/types.ts` | `BaseLayerSettings` |
| Default values and properties UI | `src/ui/BaseLayerSettingsDialog.tsx` | `DEFAULT_BASE_LAYER_SETTINGS`, `BaseLayerSettingsDialog` |
| Settings state and saved colour preferences | `src/App.tsx` | `baseLayerSettings`, `updateBaseLayerSettings`, `resetBaseLayerSettings`, `saveBaseLayerSettings` |
| Base reset button and properties button | `src/ui/panels/LayersPanel.tsx` | `onResetBaseLayerSettings`, `onOpenBaseLayerSettings` |
| Overall Base Layer opacity | `src/ui/panels/LayersPanel.tsx` and `src/App.tsx` | Layers-panel opacity control; `handleUpdateOpacity` |
| Transparent UV composite | `src/App.tsx` | `syncCompositeCanvas` |
| World-space checker shader | `src/renderer/Viewport3D.tsx` | `vVueWorldPosition`, `vueBaseColourA/B`, `vueBaseLayerOpacity` in material `onBeforeCompile` |
| 3D composite exclusion | `src/renderer/Viewport3D.tsx` | `updateCompositeTexture` layer loop |
| Legacy project restoration | `src/App.tsx` | `handleLoadXBlend` |

## Persistence rules

The key `vue3d_base_layer_colours` stores only `colorA` and `colorB`. Do not add opacity fields to this saved preference object. Project loading resets all three opacity values to 100 while retaining the current saved/in-session colours. Cancel is intentionally not a rollback operation.

## Verification status

CI compilation/build and packaging are required. Manual checks are still needed for:
1. Equal-grey startup appearance and checker visibility after changing one colour.
2. World-space checker movement/scale consistency while rotating and moving the model.
3. Independent colour opacity and overall layer opacity.
4. Paint fully covering the checker where opaque, with checker visible through untouched/transparent regions.
5. Cancel retains current session colours but does not update saved colour preferences.
6. Save restores both chosen colours after a fresh application session; opacity values return to 100%.
7. Reset works both from the dialog and the Base Layer row button.
8. UV view and exported texture remain free of the world-space checker.
9. Legacy and newly saved `.xblend` project round-trips.

Do not claim manual acceptance based on CI alone.
