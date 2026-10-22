# VUE 3D Canvas — Import Directory

Place language ZIP backup archives in this folder for the **Restore / Extract** GitHub Action workflow (`.github/workflows/import-extract.yml`).

## Supported Archives
- `vue3d-backup-rust.zip`
- `vue3d-backup-python.zip`
- `vue3d-backup-c.zip`
- Custom named archives (specified via the workflow dispatch inputs)

## Safe Scoped Extraction
When you trigger `import-extract.yml`:
1. Selecting **Python** unpacks strictly into `python_desktop/`.
2. Selecting **C** unpacks strictly into `native_c/`.
3. Selecting **Rust** unpacks into root workspace while strictly guarding and preventing any modification of other language folders.
4. If the "Delete archive after extraction" checkbox is checked, the zip file is automatically removed from this folder upon successful extraction.
