# Apply self-host evening source changes

The agentic MD files on `main` list **done vs open**.

Source edits for gizmo size, auto-hide dialogs, hashing filter params, and layer multi-select are in:

`self-host-evening-2026-11-19.patch`

```bash
git apply self-host-evening-2026-11-19.patch
# or: patch -p1 < self-host-evening-2026-11-19.patch
npm run build && npm run host:sync
```

Then continue open items in `AGENTS.md` / `SELF_HOST_TASK_2026-11-19.md`.
