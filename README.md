# SFM 模板 — 3D 布局查看器

Minecraft SFM (Super Factory Manager) 自动化布局的 3D 交互展示页面。

## 功能

- 3D 模型交互查看（拖拽旋转、滚轮缩放）
- 鼠标悬停显示方块名称、所属 Mod 及功能描述
- 在灌注室 / 附魔装置两个布局间切换

## 文件结构

```
├── index.html               # 主页面（Three.js 3D 查看器）
├── models/
│   ├── 灌注室/               # 灌注室布局 3D 模型
│   │   ├── scene.gltf
│   │   ├── scene.bin
│   │   ├── scene.uv.bin
│   │   └── textures/atlas/*.png
│   └── 附魔装置/              # 附魔装置布局 3D 模型
│       ├── scene.gltf
│       ├── scene.bin
│       ├── scene.uv.bin
│       └── textures/atlas/*.png
└── 1.21.1/
    ├── 灌注室代码.md          # 灌注室 SFM 配置文档
    ├── 附魔装置.md            # 附魔装置 SFM 配置文档
    └── images/               # 文档截图
```

## 使用

直接通过 GitHub Pages 访问，或本地启动：

```bash
npx serve .
```

模型使用 [VoxelBridge](https://www.curseforge.com/minecraft/mc-mods/voxelbridge) 从游戏内导出。
