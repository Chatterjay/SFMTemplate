const PINYIN_MAP = {
  '创': 'chuang', '造': 'zao', '之': 'zhi', '源': 'yuan',
  '罐': 'guan', '灌': 'guan', '注': 'zhu', '室': 'shi',
  '动': 'dong', '态': 'tai',
  '扩': 'kuo', '展': 'zhan', '样': 'yang', '板': 'ban',
  '供': 'gong', '应': 'ying', '器': 'qi',
  '木': 'mu', '桶': 'tong',
  '白': 'bai', '色': 'se', '混': 'hun', '凝': 'ning', '土': 'tu',
  '线': 'xian', '缆': 'lan',
  '管': 'guan', '理': 'li',
  '奥': 'ao', '术': 'shu', '核': 'he', '心': 'xin',
  '平': 'ping', '台': 'tai',
  '附': 'fu', '魔': 'mo', '装': 'zhuang', '置': 'zhi',
  '实': 'shi', '体': 'ti',
  '块': 'kuai', '方': 'fang', '标': 'biao', '识': 'shi',
  '区': 'qu', '域': 'yu', '用': 'yong', '于': 'yu',
  '暂': 'zan', '存': 'cun', '容': 'rong',
  '连': 'lian', '接': 'jie', '传': 'chuan', '输': 'shu',
  '信': 'xin', '号': 'hao', '运': 'yun', '行': 'xing',
  '控': 'kong', '制': 'zhi', '流': 'liu', '向': 'xiang',
  '程': 'cheng', '序': 'xu',
  '额': 'e', '外': 'wai', '组': 'zu', '件': 'jian',
  '发': 'fa', '层': 'ceng', '基': 'ji', '座': 'zuo',
  '交': 'jiao', '互': 'hu', '查': 'cha', '看': 'kan',
  '悬': 'xuan', '停': 'ting', '转': 'zhuan', '旋': 'xuan',
  '缩': 'suo',
  '名': 'ming', '称': 'cheng', '所': 'suo', '属': 'shu',
  '描': 'miao', '述': 'shu', '功': 'gong', '能': 'neng',
  '切': 'qie', '换': 'huan',
  '网': 'wang', '格': 'ge', '阴': 'yin', '影': 'ying',
  '灯': 'deng',
};

function toPinyin(text) {
  let r = '';
  for (const c of text) {
    r += PINYIN_MAP[c] || c;
  }
  return r.toLowerCase();
}

function toInitials(text) {
  let r = '';
  for (const c of text) {
    const p = PINYIN_MAP[c];
    r += p ? p[0] : c;
  }
  return r.toLowerCase();
}

function fuzzyMatch(q, target) {
  let j = 0;
  for (let i = 0; i < target.length && j < q.length; i++) {
    if (q[j] === target[i]) j++;
  }
  return j === q.length;
}

/* Search index: each entry knows how to match */
const index = [];

export function buildIndex(models, blockInfo) {
  index.length = 0;
  const seenBlock = new Set();

  for (const m of models) {
    const namePy = toPinyin(m.name);
    const nameIn = toInitials(m.name);
    index.push({
      id: m.id,
      type: 'model',
      label: m.name,
      sub: null,
      name: m.name,
      namePy,
      nameIn,
    });
    // Collect unique block names for this model
    for (const l of m.labels || []) {
      for (const mesh of l.meshes) {
        const info = blockInfo[mesh] || blockInfo[mesh.replace(/:/g, '')];
        if (!info || seenBlock.has(info.name)) continue;
        seenBlock.add(info.name);
        const bn = info.name.replace(/\s*\(.*?\)\s*$/, '').trim();
        const bnPy = toPinyin(bn);
        const bnIn = toInitials(bn);
        index.push({
          id: m.id,
          type: 'block',
          label: bn,
          sub: m.name,
          name: bn,
          namePy: bnPy,
          nameIn: bnIn,
        });
      }
    }
  }
}

function scoreItem(q, item) {
  const n = item.name.toLowerCase();
  const ql = q.toLowerCase();
  if (n.includes(ql)) return 100;
  if (item.namePy.includes(ql)) return 80;
  if (item.nameIn.includes(ql)) return 60;
  if (fuzzyMatch(ql, n)) return 40;
  if (fuzzyMatch(ql, item.namePy)) return 30;
  return 0;
}

/* ── DOM ── */
const CLS = 'sf-search';

const html = `
<div class="${CLS}-wrap">
  <input class="${CLS}-input" type="text" placeholder="搜模型..." spellcheck="false" />
  <div class="${CLS}-drop"></div>
</div>`;

const style = document.createElement('style');
style.textContent = `
.${CLS}-wrap { position:relative; flex-shrink:0; }
.${CLS}-input {
  width:120px; padding:5px 10px; border:1px solid #2a2a4a; border-radius:5px;
  background:#0d0d1f; color:#ccc; font-size:13px; outline:none; transition:all .2s;
}
.${CLS}-input:focus { width:200px; border-color:#e94560; background:#111128; }
.${CLS}-input::placeholder { color:#444; }
.${CLS}-drop {
  position:absolute; top:calc(100% + 4px); left:0; right:0;
  background:#141428; border:1px solid #2a2a4a; border-radius:6px;
  box-shadow:0 8px 32px rgba(0,0,0,.6); z-index:200;
  max-height:320px; overflow-y:auto; display:none; font-size:13px;
}
.${CLS}-drop.show { display:block; }
.${CLS}-drop::-webkit-scrollbar { width:4px; }
.${CLS}-drop::-webkit-scrollbar-thumb { background:#2a2a4a; border-radius:2px; }
.${CLS}-item {
  display:flex; align-items:center; gap:8px; padding:7px 12px; cursor:pointer;
  color:#999; transition:all .12s; border-left:3px solid transparent;
}
.${CLS}-item:hover { background:#1a1a35; color:#ccc; }
.${CLS}-item .tag {
  font-size:10px; background:#1e1e3a; color:#666; padding:1px 6px; border-radius:3px;
  flex-shrink:0;
}
.${CLS}-item .sub { font-size:11px; color:#555; margin-left:auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
`;

let input, drop;

export function mountSearch(headerEl, { onSelect }) {
  headerEl.insertAdjacentHTML('beforeend', html);
  document.head.appendChild(style);

  input = headerEl.querySelector(`.${CLS}-input`);
  drop = headerEl.querySelector(`.${CLS}-drop`);

  function show() { drop.classList.add('show'); }
  function hide() { drop.classList.remove('show'); }

  input.addEventListener('focus', () => { if (drop.children.length) show(); });
  input.addEventListener('blur', () => setTimeout(hide, 180));
  input.addEventListener('input', () => {
    const q = input.value;
    if (!q.trim()) { drop.innerHTML = ''; hide(); return; }

    const scored = index.map(item => ({ item, score: scoreItem(q, item) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    drop.innerHTML = scored.map(({ item }) => `
      <div class="${CLS}-item" data-id="${item.id}" data-type="${item.type}">
        <span class="tag" style="background:${item.type === 'model' ? '#2a4a2a' : '#2a2a4a'};color:${item.type === 'model' ? '#4fc34f' : '#888'}">${item.type === 'model' ? '模' : '块'}</span>
        <span>${highlight(item.label, q)}</span>
        ${item.sub ? `<span class="sub">${item.sub}</span>` : ''}
      </div>
    `).join('');

    if (drop.children.length) show(); else hide();
  });

  drop.addEventListener('mousedown', (e) => {
    const el = e.target.closest(`.${CLS}-item`);
    if (!el) return;
    input.value = '';
    hide();
    onSelect(el.dataset.id, el.dataset.type);
  });
}

function highlight(text, query) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let out = '', i = 0;
  for (let j = 0; j < t.length && i < text.length; j++) {
    if (t[j] === q[0]) {
      out += `<b style="color:#e94560">${text[i]}</b>`;
      q = q.slice(1);
    } else {
      out += text[i];
    }
    i++;
  }
  return out + text.slice(i);
}
