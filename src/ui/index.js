import * as THREE from 'three';
import { getBlockInfo, getModColor, getModel } from '../config/index.js';

export function createUI(scene) {
  const labelSprites = [];
  const labelOrigMats = [];
  let tooltipPinned = false;

  function setTooltipPinned(val) { tooltipPinned = val; }
  function isTooltipPinned() { return tooltipPinned; }

  function showTooltip(tooltipEl, tooltipInner, html, event) {
    tooltipInner.innerHTML = html;
    positionTooltip(tooltipEl, event);
    tooltipEl.classList.add('visible');
  }

  function hideTooltip(tooltipEl) {
    tooltipPinned = false;
    tooltipEl.classList.remove('visible', 'pinned');
  }

  function positionTooltip(tooltipEl, event) {
    const tw = Math.min(280, window.innerWidth - 32);
    const th = tooltipEl.offsetHeight || 100;
    let tx = event.clientX + 16;
    let ty = event.clientY + 16;
    if (tx + tw > window.innerWidth - 16) tx = event.clientX - tw - 16;
    if (ty + th > window.innerHeight - 16) ty = window.innerHeight - th - 16;
    tooltipEl.style.left = Math.max(16, tx) + 'px';
    tooltipEl.style.top = Math.max(16, ty) + 'px';
  }

  /* ── Sidebar ── */
  function buildSidebar(sidebarList, blockCountEl, allMeshes, handlers) {
    sidebarList.innerHTML = '';
    const seen = new Set();
    const items = [];

    allMeshes.forEach(m => {
      if (!m.name || seen.has(m.name)) return;
      seen.add(m.name);
      const info = getBlockInfo(m.name);
      const color = getModColor(info.mod);
      items.push({ name: m.name, info, color, mesh: m });
    });

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'block-item';
      el.dataset.name = item.name;
      el.innerHTML = `
      <span class="block-dot" style="background:${item.color}"></span>
      <span class="block-name">${item.info.name}</span>
      <span class="block-mod" style="color:${item.color}">${item.info.mod}</span>
    `;
      el.addEventListener('click', () => handlers.onFocus(item.mesh, item.name));
      el.addEventListener('mouseenter', () => handlers.onHover(item.mesh));
      el.addEventListener('mouseleave', () => handlers.onUnhover(item.mesh));
      sidebarList.appendChild(el);
    });

    blockCountEl.textContent = items.length;
    updateSidebarActive(sidebarList, null);
  }

  function updateSidebarActive(sidebarList, name) {
    sidebarList.querySelectorAll('.block-item').forEach(el => {
      el.classList.toggle('active', el.dataset.name === name);
    });
  }

  /* ── Block Labels ── */
  function createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(128 - r, 0);
    ctx.quadraticCurveTo(128, 0, 128, r);
    ctx.lineTo(128, 64 - r);
    ctx.quadraticCurveTo(128, 64, 128 - r, 64);
    ctx.lineTo(r, 64);
    ctx.quadraticCurveTo(0, 64, 0, 64 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(233,69,96,0.88)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 33);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.0, 0.5, 1);
    return sprite;
  }

  function highlightLabelMeshes(allMeshes, activeModel) {
    unhighlightLabelMeshes();
    const labels = getModel(activeModel)?.labels;
    if (!labels) return;
    for (const entry of labels) {
      let found = null;
      for (const meshName of entry.meshes) {
        found = allMeshes.find(m =>
          m.name === meshName || m.name === meshName.replace(/:/g, '')
        );
        if (found) break;
      }
      if (!found) continue;
      const mats = Array.isArray(found.material) ? found.material : [found.material];
      labelOrigMats.push({
        mesh: found,
        materials: mats.map(m => ({
          emissive: m.emissive ? m.emissive.clone() : null,
          intensity: m.emissiveIntensity ?? 0
        }))
      });
      mats.forEach(m => {
        if (m.emissive) { m.emissive.setHex(0x44dd44); m.emissiveIntensity = 0.45; }
      });
      const box = new THREE.Box3().setFromObject(found);
      const ctr = box.getCenter(new THREE.Vector3());
      const siz = box.getSize(new THREE.Vector3());
      ctr.y += siz.y / 2 + 0.2;
      const sprite = createLabelSprite(entry.label);
      sprite.position.copy(ctr);
      scene.add(sprite);
      labelSprites.push(sprite);
    }
  }

  function unhighlightLabelMeshes() {
    for (const entry of labelOrigMats) {
      const mats = Array.isArray(entry.mesh.material) ? entry.mesh.material : [entry.mesh.material];
      mats.forEach((m, i) => {
        const o = entry.materials[i];
        if (o && m.emissive) { m.emissive.copy(o.emissive || new THREE.Color(0)); m.emissiveIntensity = o.intensity; }
      });
    }
    labelOrigMats.length = 0;
    for (const s of labelSprites) scene.remove(s);
    labelSprites.length = 0;
  }

  return {
    showTooltip,
    hideTooltip,
    positionTooltip,
    setTooltipPinned,
    isTooltipPinned,
    buildSidebar,
    updateSidebarActive,
    highlightLabelMeshes,
    unhighlightLabelMeshes,
  };
}
