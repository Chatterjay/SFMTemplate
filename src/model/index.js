import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  VISIBLE_BLOCKENTITIES,
  HIDDEN_MESHES
} from '../config/index.js';

export function createModelManager(scene, controls, camera) {
  const loader = new GLTFLoader();
  const modelGroups = {};
  let currentScene = null;
  let allMeshes = [];
  let activeModel = '';

  function collectMeshes(group) {
    allMeshes = [];
    group.traverse(c => {
      if (c.isMesh && (c.visible || VISIBLE_BLOCKENTITIES.has(c.name))) {
        // Reset emissive so cached models don't carry stale highlights
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach(m => { if (m.emissive) { m.emissive.setHex(0); m.emissiveIntensity = 0; } });
        allMeshes.push(c);
      }
    });
    return allMeshes;
  }

  async function loadModel(name) {
    const ext = await fetch(`models/${name}/scene.glb`, { method: 'HEAD' })
      .then(r => r.ok ? 'glb' : 'gltf');
    const gltf = await loader.loadAsync(`models/${name}/scene.${ext}`);
    const group = gltf.scene;

    group.traverse(child => {
      if (!child.isMesh) return;
      if (!child.name && child.parent?.name) child.name = child.parent.name;
      if (HIDDEN_MESHES.has(child.name)) {
        child.visible = false;
        return;
      }
      if (child.name && child.name.startsWith('blockentity') && !VISIBLE_BLOCKENTITIES.has(child.name)) {
        child.visible = false;
        return;
      }
      // Auto-fix alpha BLEND materials (transparent without alphaTest):
      // force alpha test + depth write to prevent see-through issues
      if (child.material.transparent && !child.material.alphaTest) {
        child.material.alphaTest = 0.5;
        child.material.transparent = false;
        child.material.depthWrite = true;
        child.material.needsUpdate = true;
      }
      if (child.visible) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    group.position.sub(center);
    group.position.y += 0.5;

    controls.target.set(0, 0, 0);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.6;
    camera.position.set(dist * 0.7, dist * 0.5, dist * 0.8);
    controls.update();

    group.rotation.y = -Math.PI / 6;
    return group;
  }

  async function switchModel(name) {
    if (activeModel === name && currentScene) return;

    if (currentScene) scene.remove(currentScene);

    if (modelGroups[name]) {
      currentScene = modelGroups[name];
      scene.add(currentScene);
      collectMeshes(currentScene);
    } else {
      const group = await loadModel(name);
      modelGroups[name] = group;
      currentScene = group;
      scene.add(currentScene);
      collectMeshes(group);
    }

    activeModel = name;
    localStorage.setItem('sfm_active_model', name);
    return allMeshes;
  }

  return {
    switchModel,
    getAllMeshes: () => allMeshes,
    getActiveModel: () => activeModel,
    getCurrentScene: () => currentScene,
  };
}
