import * as THREE from 'three';

export function createInteraction(renderer, camera) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredOriginalMaterials = null;

  function getMeshUnderPointer(event, allMeshes) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (!allMeshes.length) return null;
    const hits = raycaster.intersectObjects(allMeshes);
    return hits.length > 0 ? hits[0].object : null;
  }

  function highlightMesh(mesh) {
    if (!mesh || !mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    hoveredOriginalMaterials = materials.map(m => ({
      emissive: m.emissive ? m.emissive.clone() : null,
      intensity: m.emissiveIntensity ?? 0,
    }));
    materials.forEach(m => {
      if (m.emissive) { m.emissive.setHex(0x4488ff); m.emissiveIntensity = 0.35; }
    });
  }

  function unhighlightMesh(mesh) {
    if (!mesh || !mesh.isMesh || !hoveredOriginalMaterials) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((m, i) => {
      const o = hoveredOriginalMaterials[i];
      if (o && m.emissive) { m.emissive.copy(o.emissive || new THREE.Color(0)); m.emissiveIntensity = o.intensity; }
    });
    hoveredOriginalMaterials = null;
  }

  return { getMeshUnderPointer, highlightMesh, unhighlightMesh };
}
