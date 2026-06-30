export const MOD_COLORS = {
  "Ars Nouveau": "#e87d3e",
  "Extended AE": "#4fc3f7",
  "Minecraft": "#7c7c7c",
  "Super Factory Manager": "#e94560",
};

let _models = [];
let _blockInfo = {};
let _blockLookup = {};

export async function loadConfig() {
  const resp = await fetch('models/registry.json');
  const ids = await resp.json();

  _models = [];
  _blockInfo = {};

  for (const id of ids) {
    const mResp = await fetch(`models/${id}/model.json`);
    const model = await mResp.json();
    _models.push(model);
    if (model.blocks) Object.assign(_blockInfo, model.blocks);
  }

  _blockLookup = {};
  for (const [key, val] of Object.entries(_blockInfo)) {
    _blockLookup[key] = val;
    _blockLookup[key.replace(/:/g, '')] = val;
  }
}

export function getModels() { return _models; }
export function getBlockInfoMap() { return _blockInfo; }
export function getModel(id) { return _models.find(m => m.id === id); }
export function getDefaultModel() { return _models[0]?.id || ''; }

export function getBlockInfo(name) {
  const lookup = _blockLookup[name];
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

export function buildTooltipHtml(info, meshName, activeModel) {
  const model = getModel(activeModel);

  // Collect section IDs to show for this block (new-style + backward compat)
  const showIds = [...(info.showSections || [])];
  if (info.tabSfmCode && !showIds.includes('sfm')) showIds.push('sfm');
  if (info.tabPatternProvider && !showIds.includes('pattern')) showIds.push('pattern');

  // Build sections from model data
  const sectionsHtml = showIds.map(id => {
    let s;
    if (model?.sections) {
      s = model.sections.find(s => s.id === id);
    } else {
      // Backward compat: build on the fly from old fields
      if (id === 'sfm' && model?.sfmCode) s = { title: 'SFM 代码', content: model.sfmCode, copyable: true };
      if (id === 'pattern' && model?.patternProvider) s = { title: '样板供应器设置', content: model.patternProvider };
    }
    if (!s) return '';
    return `
    <div class="tooltip-code">
      <div class="tooltip-code-header">
        <span>${s.title}</span>
        ${s.copyable ? `<button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent);this.textContent='已复制';setTimeout(()=>this.textContent='复制',1500)">复制</button>` : ''}
      </div>
      <pre>${s.content}</pre>
    </div>`;
  }).join('');

  return `
    <div class="tooltip-head">
      <div class="tooltip-name">${info.name}</div>
      <div class="tooltip-mod" style="color:${getModColor(info.mod)}">${info.mod}</div>
    </div>
    <div class="tooltip-body">
      ${info.desc ? `<div class="tooltip-desc">${info.desc}</div>` : ''}
      <div class="tooltip-id">${meshName}</div>
      ${sectionsHtml}
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

export const HIDDEN_MESHES = makeSet([
  'ars_nouveau:imbuement_chamber'
]);
