# SFM 模板 — 3D 布局查看器

Minecraft SFM (Super Factory Manager) 自动化布局的 3D 交互展示页面。

## 功能

- 3D 模型交互查看（拖拽旋转、滚轮缩放）
- 鼠标悬停显示方块名称、所属 Mod 及功能描述
- 标签系统标注方块对应 SFM 编号
- 方框高亮 + 镜头飞入聚焦
- 模糊搜索（支持中文、拼音），使用 fuse.js
- 自动旋转切换
- 多模板 Tab 切换

## 文件结构

```
├── index.html                 # 主页面 + importmap
├── src/
│   ├── app/index.js           # 入口：事件绑定、模块协调
│   ├── config/index.js        # 集中配置：方块信息、模板定义、颜色
│   ├── scene/index.js         # Three.js 场景/相机/灯光/轨道控制
│   ├── model/index.js         # GLB 加载、缓存、网格处理
│   ├── interaction/index.js   # 射线拾取、高亮
│   ├── ui/index.js            # 侧栏、tooltip、标签精灵
│   └── search/index.js        # 模糊搜索（fuse.js）+ pinyin 索引
├── styles/style.css
├── models/
│   ├── 灌注室/
│   │   ├── scene.glb          # VoxelBridge 导出的 3D 模型
│   │   ├── doc.md             # 模板说明文档（可选）
│   │   └── textures/          # 模型贴图
│   └── 附魔装置/
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

可选添加 `doc.md` 作为模板说明文档。

### 2. 注册方块信息

在 `src/config/index.js` 的 `BLOCK_INFO` 中添加模板中用到的每个方块：

```js
"mod名称:方块id": {
  name: "显示名称",
  mod: "所属 Mod",
  desc: "功能描述",
  // 可选标记
  tabSfmCode: true,        // 在 tooltip 中显示 sfmCode
  tabPatternProvider: true, // 在 tooltip 中显示 patternProvider
}
```

> 键名与 GLB 中的 mesh 名称对应，框架会自动处理带冒号和不带冒号两种格式。

### 3. 添加模板配置

在 `MODELS` 数组中添加新模板：

```js
{
  id: '你的模板',          // 唯一标识，与文件夹名一致
  name: '你的模板',         // 显示在 Tab 上的名称
  sfmCode: `...`,          // SFM 代码文本（tooltip 中显示）
  patternProvider: null,   // 样板供应器设置文本，没有则 null
  labels: [                // 方块标签，对应 SFM 编号
    { label: '1', meshes: ['minecraft:barrel'] },
    { label: '2', meshes: ['ars_nouveau:some_machine'] },
  ],
}
```

- `id` 必须与 `models/<id>/` 文件夹名一致
- `labels` 的 `meshes` 数组引用 GLB 中的 mesh 名称，多个 mesh 可共用同一标签
- 同一方块类型在不同模板中会自动分别出现在搜索结果中

### 4. 特殊处理（按需）

如果新模板的 mesh 需要特殊渲染，在 `src/config/index.js` 底部设置：

```js
// 强制显示这些 mesh（即使 GLB 中标记为隐藏）
export const VISIBLE_BLOCKENTITIES = makeSet([
  'blockentity:ars_nouveau:imbuement_chamber',
  ...
]);

// 对透明贴图的 mesh 启用 alpha test
export const ALPHA_CLIP_MESHES = makeSet([
  'ars_nouveau:creative_source_jar',
  ...
]);

// 隐藏不需要显示的 mesh
export const HIDDEN_MESHES = makeSet([
  'ars_nouveau:imbuement_chamber',
  ...
]);
```

### 5. 验证

重启本地服务，新模板应出现在顶栏 Tab 中，搜索应能定位到模板内的方块。

## 技术栈

- [Three.js](https://threejs.org/) (r160) — 3D 渲染
- [fuse.js](https://fusejs.io/) (v7) — 模糊搜索
- ES Modules（无构建步骤，通过 importmap 加载）
- [VoxelBridge](https://www.curseforge.com/minecraft/mc-mods/voxelbridge) — 模型导出
