import * as THREE from 'three';
import { createScene } from '../scene/index.js';
import { createModelManager } from '../model/index.js';
import { createInteraction } from '../interaction/index.js';
import { createUI } from '../ui/index.js';
import { loadConfig, getModels, getDefaultModel, getBlockInfo, getBlockInfoMap, buildTooltipHtml } from '../config/index.js';
import { buildIndex, mountSearch } from '../search/index.js';

/* ── DOM refs ── */
const container = document.getElementById('canvas-container');
const loadingEl = document.getElementById('loading');
const tooltipEl = document.getElementById('tooltip');
const tooltipInner = tooltipEl.querySelector('.tooltip-inner');
const sidebarList = document.getElementById('block-list');
const blockCountEl = document.getElementById('block-count');
const rotateBtn = document.getElementById('rotate-toggle');

/* ── Init modules ── */
const { renderer, scene, camera, controls } = createScene(container);
const modelMgr = createModelManager(scene, controls, camera);
const interaction = createInteraction(renderer, camera);
const ui = createUI(scene);

/* ── Shared state ── */
let currentTooltipTarget = null;
let tooltipHideTimer = null;
let allMeshes = [];

/* ── Camera animation ── */
function animateCameraTo(targetPos) {
  const startTarget = controls.target.clone();
  const startPos = camera.position.clone();
  const dir = startPos.clone().sub(startTarget).normalize();
  const dist = startPos.distanceTo(startTarget);
  const endTarget = targetPos;
  const endPos = targetPos.clone().add(dir.multiplyScalar(dist));
  const duration = 400;
  const startTime = performance.now();

  function tick(time) {
    const t = Math.min((time - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Sidebar handlers ── */
const sidebarHandlers = {
  onFocus: (mesh, name) => {
    if (!mesh) return;
    interaction.unhighlightMesh(currentTooltipTarget);
    ui.hideTooltip(tooltipEl);
    currentTooltipTarget = null;

    const center = new THREE.Vector3();
    mesh.getWorldPosition(center);
    if (mesh.geometry?.boundingBox) {
      const local = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
      center.add(local);
    }
    animateCameraTo(center);
    ui.updateSidebarActive(sidebarList, name);

    const isManager = name === 'sfm:manager' || name === 'sfmmanager';
    if (isManager) {
      ui.highlightLabelMeshes(allMeshes, modelMgr.getActiveModel());
    } else {
      ui.unhighlightLabelMeshes();
    }

    tooltipInner.innerHTML = buildTooltipHtml(
      getBlockInfo(name), name, modelMgr.getActiveModel()
    );
    tooltipEl.style.left = (sidebarList.getBoundingClientRect().left - 296) + 'px';
    tooltipEl.style.top = '100px';
    tooltipEl.classList.add('visible', 'pinned');
    ui.setTooltipPinned(true);

    interaction.highlightMesh(mesh);
    currentTooltipTarget = mesh;
  },

  onHover: (mesh) => {
    if (!mesh) return;
    if (ui.isTooltipPinned()) {
      interaction.highlightMesh(mesh);
    } else {
      interaction.unhighlightMesh(currentTooltipTarget);
      ui.hideTooltip(tooltipEl);
      currentTooltipTarget = mesh;
      interaction.highlightMesh(mesh);
    }
  },

  onUnhover: (mesh) => {
    if (!mesh) return;
    if (ui.isTooltipPinned()) {
      interaction.unhighlightMesh(mesh);
      if (currentTooltipTarget) interaction.highlightMesh(currentTooltipTarget);
    } else if (currentTooltipTarget === mesh) {
      interaction.unhighlightMesh(currentTooltipTarget);
      ui.hideTooltip(tooltipEl);
      currentTooltipTarget = null;
    }
  },
};

/* ── Switch model ── */
async function switchModel(name) {
  if (modelMgr.getActiveModel() === name && modelMgr.getCurrentScene()) return;

  interaction.unhighlightMesh(currentTooltipTarget);
  ui.hideTooltip(tooltipEl);
  ui.unhighlightLabelMeshes();
  currentTooltipTarget = null;

  loadingEl.classList.remove('hidden');
  try {
    allMeshes = await modelMgr.switchModel(name);
  } catch (err) {
    console.error(err);
    loadingEl.querySelector('p').textContent = '模型加载失败，请刷新重试';
    return;
  } finally {
    loadingEl.classList.add('hidden');
  }

  ui.buildSidebar(sidebarList, blockCountEl, allMeshes, sidebarHandlers);
  rebuildTabs(name);
}

/* ── Pointer events ── */
container.addEventListener('pointermove', (event) => {
  const curScene = modelMgr.getCurrentScene();
  if (!curScene || !allMeshes.length) return;
  const mesh = interaction.getMeshUnderPointer(event, allMeshes);

  if (mesh !== currentTooltipTarget) {
    if (mesh) {
      if (tooltipHideTimer) { clearTimeout(tooltipHideTimer); tooltipHideTimer = null; }
      interaction.unhighlightMesh(currentTooltipTarget);
      ui.hideTooltip(tooltipEl);
      currentTooltipTarget = mesh;
      interaction.highlightMesh(mesh);
      ui.showTooltip(
        tooltipEl, tooltipInner,
        buildTooltipHtml(getBlockInfo(mesh.name), mesh.name, modelMgr.getActiveModel()),
        event
      );
    } else if (currentTooltipTarget) {
      if (!ui.isTooltipPinned()) {
        if (!tooltipHideTimer) {
          tooltipHideTimer = setTimeout(() => {
            interaction.unhighlightMesh(currentTooltipTarget);
            ui.hideTooltip(tooltipEl);
            currentTooltipTarget = null;
            tooltipHideTimer = null;
          }, 200);
        }
      }
    }
    const activeName = ui.isTooltipPinned() && currentTooltipTarget
      ? currentTooltipTarget.name : (mesh?.name || null);
    ui.updateSidebarActive(sidebarList, activeName);
  } else if (mesh) {
    ui.positionTooltip(tooltipEl, event);
  }
});

container.addEventListener('pointerleave', () => {
  if (ui.isTooltipPinned()) return;
  if (tooltipHideTimer) { clearTimeout(tooltipHideTimer); tooltipHideTimer = null; }
  interaction.unhighlightMesh(currentTooltipTarget);
  ui.hideTooltip(tooltipEl);
  currentTooltipTarget = null;
});

/* ── Tab buttons (dynamic from MODELS) ── */
const tabContainer = document.querySelector('.tabs');
function rebuildTabs(activeName) {
  tabContainer.innerHTML = '';
  for (const model of getModels()) {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    if (model.id === activeName) btn.classList.add('active');
    btn.dataset.model = model.id;
    btn.textContent = model.name;
    btn.addEventListener('click', () => switchModel(model.id));
    tabContainer.appendChild(btn);
  }
}

/* ── Search ── */
mountSearch(document.querySelector('header'), {
  onSelect: (modelId, type, label, meshName) => {
    /* Always clear current state before acting */
    interaction.unhighlightMesh(currentTooltipTarget);
    ui.hideTooltip(tooltipEl);
    ui.unhighlightLabelMeshes();
    currentTooltipTarget = null;
    /* Force-reset emissive on all meshes (covers stale hoveredOriginalMaterials) */
    for (const m of allMeshes) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach(mat => { if (mat.emissive) { mat.emissive.setHex(0); mat.emissiveIntensity = 0; } });
    }

    function focusBlock() {
      const mesh = allMeshes.find(m =>
        m.name === meshName || m.name === meshName.replace(/:/g, '')
      );
      if (mesh) sidebarHandlers.onFocus(mesh, mesh.name);
    }

    if (type === 'block' && modelId !== modelMgr.getActiveModel()) {
      switchModel(modelId).then(focusBlock);
    } else if (type === 'block') {
      focusBlock();
    } else if (modelId !== modelMgr.getActiveModel()) {
      switchModel(modelId);
    }
  },
});

/* ── Auto-rotate toggle ── */
rotateBtn.classList.toggle('on', controls.autoRotate);
rotateBtn.textContent = controls.autoRotate ? '⟳ 自动旋转' : '⟳ 已暂停';
rotateBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  localStorage.setItem('sfm_auto_rotate', controls.autoRotate);
  rotateBtn.classList.toggle('on', controls.autoRotate);
  rotateBtn.textContent = controls.autoRotate ? '⟳ 自动旋转' : '⟳ 已暂停';
});

/* ── Resize ── */
function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);

/* ── Animation loop ── */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ── Start ── */
await loadConfig();
buildIndex(getModels(), getBlockInfoMap());
const savedModel = localStorage.getItem('sfm_active_model') || getDefaultModel();
rebuildTabs(savedModel);
switchModel(savedModel);
