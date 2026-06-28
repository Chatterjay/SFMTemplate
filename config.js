export const MOD_COLORS = {
  "Ars Nouveau": "#e87d3e",
  "Extended AE": "#4fc3f7",
  "Minecraft": "#7c7c7c",
  "Super Factory Manager": "#e94560",
};

export const BLOCK_INFO = {
  "ars_nouveau:creative_source_jar": {
    name: "创造之源罐", mod: "Ars Nouveau",
    desc: "提供无限源能，为灌注 / 附魔装置供能"
  },
  "ars_nouveau:imbuement_chamber": {
    name: "灌注室", mod: "Ars Nouveau",
    desc: "灌注物品的核心机器，配合 SFM 自动化处理"
  },
  "blockentity:ars_nouveau:imbuement_chamber": {
    name: "灌注室 (动态)", mod: "Ars Nouveau",
    desc: "灌注室内部动态渲染层（旋转动画等）"
  },
  "extendedae:ex_pattern_provider": {
    name: "扩展样板供应器", mod: "Extended AE",
    desc: "AE2 自动合成样板供应，阻挡模式控制物品输出",
    tabPatternProvider: true
  },
  "minecraft:barrel": {
    name: "木桶", mod: "Minecraft",
    desc: "物品暂存容器，SFM 管理的输入 / 输出缓冲"
  },
  "minecraft:white_concrete": {
    name: "白色混凝土", mod: "Minecraft",
    desc: "装饰 / 标记方块，用于区域标识"
  },
  "sfm:cable": {
    name: "SFM 线缆", mod: "Super Factory Manager",
    desc: "连接 SFM 管理器与各容器，传输物品信号"
  },
  "sfm:manager": {
    name: "SFM 管理器", mod: "Super Factory Manager",
    desc: "运行 SFM 自动化程序，控制物品流向",
    tabSfmCode: true
  },
  "ars_nouveau:arcane_core_emissive": {
    name: "奥术核心", mod: "Ars Nouveau",
    desc: "附魔装置的核心组件，发光层"
  },
  "ars_nouveau:arcane_platform": {
    name: "奥术平台", mod: "Ars Nouveau",
    desc: "放置被附魔物品的平台基座"
  },
  "ars_nouveau:enchanting_apparatus": {
    name: "附魔装置", mod: "Ars Nouveau",
    desc: "附魔物品的主机器，需要周围 pedestal 配合"
  },
  "blockentity:ars_nouveau:arcane_core": {
    name: "奥术核心 (实体)", mod: "Ars Nouveau",
    desc: "奥术核心的方块实体渲染层"
  },
  "blockentity:ars_nouveau:enchanting_apparatus": {
    name: "附魔装置 (实体)", mod: "Ars Nouveau",
    desc: "附魔装置额外渲染层（旋转粒子等）"
  },
  "blockentity:ars_nouveau:enchanting_apparatus_2": {
    name: "附魔装置 (实体)", mod: "Ars Nouveau",
    desc: "附魔装置动态模型渲染"
  }
};

// Build name lookup with and without colons (GLB from Blender strips them)
const BLOCK_LOOKUP = {};
for (const [key, val] of Object.entries(BLOCK_INFO)) {
  BLOCK_LOOKUP[key] = val;
  BLOCK_LOOKUP[key.replace(/:/g, '')] = val;
}

export function getBlockInfo(name) {
  const lookup = BLOCK_LOOKUP[name];
  if (lookup) return lookup;
  const parts = name.split(':');
  return {
    name: parts.length > 1 ? parts.pop().replace(/_/g, ' ') : name.replace(/_/g, ' '),
    mod: parts.length > 1 ? parts.join(':') : '',
    desc: ''
  };
}

export function getModColor(mod) {
  return MOD_COLORS[mod] || '#888';
}

// Tab-specific SFM code file paths
export const SFM_CODE_FILES = {
  '灌注室': '1.21.1/灌注室代码.md',
  '附魔装置': '1.21.1/附魔装置.md'
};

// Model processing rules
// Blockentity meshes that should stay visible (others are hidden to avoid z-fighting)
export function buildVisibleBlockentitySet() {
  const names = [
    'blockentity:ars_nouveau:imbuement_chamber',
    'blockentity:ars_nouveau:enchanting_apparatus',
    'blockentity:ars_nouveau:arcane_core'
  ];
  const set = new Set(names);
  names.forEach(n => set.add(n.replace(/:/g, '')));
  return set;
}

// Mesh names that need alpha clip (裁掉零 alpha 像素)
export function buildAlphaClipSet() {
  const names = [
    'ars_nouveau:creative_source_jar',
    'blockentity:ars_nouveau:arcane_core'
  ];
  const set = new Set(names);
  names.forEach(n => set.add(n.replace(/:/g, '')));
  return set;
}

// Mesh names to hide entirely (outer shells with UV collapse)
export function buildHiddenMeshSet() {
  const names = [
    'ars_nouveau:imbuement_chamber'
  ];
  const set = new Set(names);
  names.forEach(n => set.add(n.replace(/:/g, '')));
  return set;
}

// Block label numbers shown when focusing the SFM manager
// Edit these arrays to change which blocks get which labels
export const TAB_LABELS = {
  '灌注室': [
    { label: '1', meshes: ['minecraft:barrel'] },
    { label: '2', meshes: ['ars_nouveau:imbuement_chamber', 'blockentity:ars_nouveau:imbuement_chamber'] },
    { label: '3', meshes: ['extendedae:ex_pattern_provider'] }
  ],
  '附魔装置': [
    { label: '1', meshes: ['minecraft:barrel'] },
    { label: '2', meshes: ['ars_nouveau:enchanting_apparatus', 'blockentity:ars_nouveau:enchanting_apparatus'] },
    { label: '3', meshes: ['ars_nouveau:arcane_platform'] },
    { label: '4', meshes: ['extendedae:ex_pattern_provider'] }
  ]
};
