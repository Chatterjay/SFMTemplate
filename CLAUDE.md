# SFM Template — 3D Layout Viewer

Minecraft SFM (Super Factory Manager) 自动化布局的 3D 交互展示页面。

## Project Structure

```
├── index.html                    # Entry point + importmap
├── src/
│   ├── app/index.js              # Orchestrator: event binding, module coordination
│   ├── config/index.js           # Config loading, block info, tooltip builder
│   ├── scene/index.js            # Three.js scene / camera / lighting / controls
│   ├── model/index.js            # GLB loading, caching, mesh processing
│   ├── interaction/index.js      # Raycasting, mesh highlighting
│   ├── ui/index.js               # Sidebar, tooltip, label sprites
│   └── search/index.js           # Fuse.js fuzzy search + pinyin
├── styles/style.css
├── scripts/
│   ├── init-model.mjs            # Auto-generate model skeleton from GLB
│   └── init-model.bat            # Windows bat wrapper
├── models/
│   ├── registry.json             # Model registration list
│   └── <model-name>/
│       ├── model.json            # Model config + block definitions
│       ├── scene.glb             # 3D model (VoxelBridge export)
│       └── doc.md                # SFM code + machine config (auto-read)
└── CLAUDE.md
```

## Tech Stack

- Three.js r160 — via importmap from unpkg CDN
- fuse.js v7 — fuzzy search with pinyin
- ES Modules — no build step

## Model Config Format (model.json)

```json
{
  "id": "模板名称",
  "name": "显示名称",
  "sections": [
    { "id": "sfm", "title": "SFM 代码", "fromDoc": true, "copyable": true },
    { "id": "pattern", "title": "样板供应器设置", "fromDoc": true }
  ],
  "labels": [
    { "label": "1", "meshes": ["minecraft:barrel"] }
  ],
  "blocks": {
    "minecraft:barrel": {
      "name": "木桶",
      "mod": "Minecraft",
      "desc": "物品暂存容器",
      "showSections": ["pattern"]
    }
  }
}
```

- `sections[].fromDoc: true` → content auto-read from doc.md by title
- `blocks[].showSections` → which sections appear in this block's tooltip
- `blocks[].tabSfmCode` / `tabPatternProvider` — legacy, do not use in new models

## Init Script

```bash
node scripts/init-model.mjs 新模板名
# or drag scene.glb onto scripts/init-model.bat
```

## Key Rules

- All JS: single quotes, no decorative comments, minimal comments (only explain WHY)
- Module pattern: factory functions returning objects (createScene, createModelManager, etc.)
- Config loaded async at startup via loadConfig() → getModels() / getBlockInfoMap()
- Search index built once at startup, includes all blocks from labels + blocks section
- GLB alpha BLEND materials auto-fixed on load (alphaTest + depthWrite)
- HIDDEN_MESHES / VISIBLE_BLOCKENTITIES in config for special cases
- Three.js import: `import * as THREE from 'three'`
- CDN imports via importmap in index.html
