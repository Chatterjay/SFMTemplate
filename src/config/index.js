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

export const MODELS = [
  {
    id: '灌注室',
    name: '灌注室',
    sfmCode: `every 60 ticks do
\tinput from "1"
\toutput to  each  "2"
\tforget
\tinput from "2"
\toutput except "minecraft:lapis_lazuli" to "3"
end`,
    patternProvider: null,
    labels: [
      { label: '1', meshes: ['minecraft:barrel'] },
      { label: '2', meshes: ['ars_nouveau:imbuement_chamber', 'blockentity:ars_nouveau:imbuement_chamber'] },
      { label: '3', meshes: ['extendedae:ex_pattern_provider'] }
    ],
  },
  {
    id: '附魔装置',
    name: '附魔装置',
    sfmCode: `every 20 ticks do
\tinput from "1" slot 1-10
\toutput to "3"
\tforget
\tinput from "1"
\toutput to "2" slot 0
\tforget
\tinput  from "2"
\toutput to "4"
end`,
    patternProvider: `- 阻挡模式：off
- 锁定合成：on`,
    labels: [
      { label: '1', meshes: ['minecraft:barrel'] },
      { label: '2', meshes: ['ars_nouveau:enchanting_apparatus', 'blockentity:ars_nouveau:enchanting_apparatus'] },
      { label: '3', meshes: ['ars_nouveau:arcane_platform'] },
      { label: '4', meshes: ['extendedae:ex_pattern_provider'] }
    ],
  },
];
export const DEFAULT_MODEL = MODELS[0].id;

export function getModel(id) {
  return MODELS.find(m => m.id === id);
}

export function buildTooltipHtml(info, meshName, activeModel) {
  const model = getModel(activeModel);
  const sfmCode = info.tabSfmCode ? model?.sfmCode : null;
  const codeHtml = sfmCode ? `
    <div class="tooltip-code">
      <div class="tooltip-code-header">
        <span>SFM 代码</span>
        <button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent);this.textContent='已复制';setTimeout(()=>this.textContent='复制',1500)">复制</button>
      </div>
      <pre>${sfmCode}</pre>
    </div>` : '';
  const ppText = info.tabPatternProvider ? model?.patternProvider : null;
  const ppHtml = ppText ? `
    <div class="tooltip-code">
      <div class="tooltip-code-header">
        <span>样板供应器设置</span>
      </div>
      <pre>${ppText}</pre>
    </div>` : '';
  return `
    <div class="tooltip-head">
      <div class="tooltip-name">${info.name}</div>
      <div class="tooltip-mod" style="color:${getModColor(info.mod)}">${info.mod}</div>
    </div>
    <div class="tooltip-body">
      ${info.desc ? `<div class="tooltip-desc">${info.desc}</div>` : ''}
      <div class="tooltip-id">${meshName}</div>
      ${codeHtml}
      ${ppHtml}
    </div>
  `;
}
function makeSet(names) {
  const set = new Set(names);
  names.forEach(n => set.add(n.replace(/:/g, '')));
  return set;
}

export const VISIBLE_BLOCKENTITIES = makeSet([
  'blockentity:ars_nouveau:imbuement_chamber',
  'blockentity:ars_nouveau:enchanting_apparatus',
  'blockentity:ars_nouveau:arcane_core'
]);

export const ALPHA_CLIP_MESHES = makeSet([
  'ars_nouveau:creative_source_jar',
  'blockentity:ars_nouveau:arcane_core'
]);

export const HIDDEN_MESHES = makeSet([
  'ars_nouveau:imbuement_chamber'
]);

