# SFM 模板 — 3D 布局查看器

Minecraft SFM (Super Factory Manager) 自动化布局的 3D 交互展示页面。

## 功能

- 3D 模型交互查看（拖拽旋转、滚轮缩放）
- 鼠标悬停显示方块名称、所属 Mod 及功能描述
- 标签系统标注方块对应 SFM 编号
- 方块高亮 + 镜头飞入聚焦
- 模糊搜索（支持中文、拼音），使用 fuse.js
- 自动旋转切换
- 多模板 Tab 切换

## 文件结构

```
├── index.html                 # 主页面 + importmap
├── src/
│   ├── app/index.js           # 入口：事件绑定、模块协调
│   ├── config/index.js        # 颜色、方块渲染配置、helper 函数
│   ├── scene/index.js         # Three.js 场景/相机/灯光/轨道控制
│   ├── model/index.js         # GLB 加载、缓存、网格处理
│   ├── interaction/index.js   # 射线拾取、高亮
│   ├── ui/index.js            # 侧栏、tooltip、标签精灵
│   └── search/index.js        # 模糊搜索（fuse.js）+ pinyin 索引
├── styles/style.css
├── models/
│   ├── registry.json           # 模板注册列表
│   ├── 灌注室/
│   │   ├── model.json          # 模板配置 + 方块信息（自动读取）
│   │   ├── scene.glb           # VoxelBridge 导出的 3D 模型
│   │   ├── doc.md              # 模板说明文档（可选）
│   │   └── textures/
│   └── 附魔装置/
│       ├── model.json
│       ├── scene.glb
│       ├── doc.md
│       └── textures/
└── README.md
```

## 使用

```bash
npx serve .
```

打开浏览器访问即可。

## 如何添加新模板

### 1. 准备模型

用 [VoxelBridge](https://www.curseforge.com/minecraft/mc-mods/voxelbridge) 从游戏导出布局为 GLB 格式，放入 `models/<模板名称>/` 目录：

```
models/你的模板/
├── scene.glb
└── textures/       # 贴图文件（自动引用）
```

### 2. 注册模板

在 `models/registry.json` 中添加模板文件夹名称：

```json
["灌注室", "附魔装置", "你的模板"]
```

### 3. 编写 model.json

在模板文件夹下创建 `model.json`，包含模板配置和方块信息：

```json
{
  "id": "你的模板",
  "name": "你的模板",
  "sfmCode": "every 60 ticks do\n\tinput from \"1\"\n\t...",
  "patternProvider": null,
  "labels": [
    { "label": "1", "meshes": ["minecraft:barrel"] },
    { "label": "2", "meshes": ["mod:id"] }
  ],
  "blocks": {
    "minecraft:barrel": {
      "name": "木桶",
      "mod": "Minecraft",
      "desc": "物品暂存容器"
    },
    "mod:id": {
      "name": "方块显示名称",
      "mod": "所属 Mod",
      "desc": "功能描述",
      "tabSfmCode": true,
      "tabPatternProvider": true
    }
  }
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，必须与文件夹名一致 |
| `name` | Tab 上显示的名称 |
| `sfmCode` | SFM 自动化代码（tooltip 中显示） |
| `patternProvider` | 样板供应器设置文本（没有则 `null`） |
| `labels` | 方块标签，对应 SFM 编号 |
| `blocks` | 方块注册表，key 为 mesh 名称，value 为显示信息 |

**blocks 中的特殊标记：**

- `tabSfmCode: true` — 在 tooltip 中显示当前模型的 sfmCode
- `tabPatternProvider: true` — 在 tooltip 中显示当前模型的 patternProvider

> 多个模板可以定义相同的 block key，系统会自动合并，后加载的覆盖先加载的。

### 4. 特殊渲染处理（按需）

如果新模板的 mesh 需要特殊渲染处理，在 `src/config/index.js` 底部修改：

```js
// 强制显示这些 mesh（即使 GLB 中标记为隐藏）
export const VISIBLE_BLOCKENTITIES = makeSet([
  'blockentity:mod:something',
]);

// 对透明贴图的 mesh 启用 alpha test
export const ALPHA_CLIP_MESHES = makeSet([
  'mod:something',
]);

// 隐藏不需要显示的 mesh
export const HIDDEN_MESHES = makeSet([
  'mod:hidden_mesh',
]);
```

### 5. 验证

重启本地服务，新模板应出现在顶栏 Tab 中，搜索应能定位到模板内的方块。

## 技术栈

- [Three.js](https://threejs.org/) (r160) — 3D 渲染
- [fuse.js](https://fusejs.io/) (v7) — 模糊搜索
- ES Modules（无构建步骤，通过 importmap 加载）
- [VoxelBridge](https://www.curseforge.com/minecraft/mc-mods/voxelbridge) — 模型导出
