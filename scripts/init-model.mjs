import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [, , modelDir] = process.argv;

if (!modelDir) {
  console.error('用法: node scripts/init-model.mjs <模型文件夹名>');
  console.error('示例: node scripts/init-model.mjs 我的新模板');
  process.exit(1);
}

/* ── 读取 GLB 提取所有 mesh 名称 ── */
function extractMeshNames(glbPath) {
  if (!existsSync(glbPath)) {
    console.error(`找不到文件: ${glbPath}`);
    process.exit(1);
  }
  const buf = readFileSync(glbPath);

  // GLB header: magic(4) + version(4) + length(4)
  const magic = buf.toString('utf8', 0, 4);
  if (magic !== 'glTF') {
    console.error('不是有效的 GLB 文件');
    process.exit(1);
  }

  // 查找 JSON chunk
  let offset = 12;
  let jsonStr = null;
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkType === 0x4E4F534A) { // JSON
      jsonStr = buf.toString('utf8', chunkStart, chunkStart + chunkLen);
      break;
    }
    offset = chunkStart + chunkLen;
  }

  if (!jsonStr) {
    console.error('GLB 中未找到 JSON chunk');
    process.exit(1);
  }

  const gltf = JSON.parse(jsonStr);
  const meshes = [];

  // 从场景图提取 mesh 名称
  for (const node of gltf.nodes || []) {
    if (node.mesh !== undefined) {
      meshes.push(node.name || `mesh_${node.mesh}`);
    }
    // 处理子节点
    if (node.children) {
      collectChildrenNames(node, gltf, meshes);
    }
  }

  return [...new Set(meshes)].sort();
}

function collectChildrenNames(node, gltf, out) {
  for (const childIdx of node.children || []) {
    const child = gltf.nodes[childIdx];
    if (child.mesh !== undefined) {
      out.push(child.name || `mesh_${child.mesh}`);
    }
    if (child.children) {
      collectChildrenNames(child, gltf, out);
    }
  }
}

/* ── 生成 model.json 骨架 ── */
function generateModelJson(id, meshNames) {
  const labels = [];
  const blocks = {};

  meshNames.forEach((name, i) => {
    const isBlockEntity = name.startsWith('blockentity:');
    const defaultName = name.includes(':') ? name.split(':').pop().replace(/_/g, ' ') : name;
    const mod = name.includes(':') ? name.split(':').slice(0, -1).join(':') : '';

    labels.push({
      label: String(i + 1),
      meshes: [name]
    });

    blocks[name] = {
      name: defaultName,
      mod: mod || 'Minecraft',
      desc: ''
    };
    if (isBlockEntity) {
      blocks[name].desc = '方块实体渲染层';
    }
  });

  const json = {
    id,
    name: id,
    sections: [
      { "id": "sfm", "title": "SFM 代码", "fromDoc": true, "copyable": true },
      { "id": "pattern", "title": "样板供应器设置", "fromDoc": true }
    ],
    labels,
    blocks
  };

  // 去掉空字符串 desc
  for (const b of Object.values(blocks)) {
    if (!b.desc) delete b.desc;
  }

  return JSON.stringify(json, null, 2) + '\n';
}

/* ── 生成 doc.md 骨架 ── */
function generateDocMd() {
  return `# ${modelDir}

## SFM 代码
\`\`\`sfm

\`\`\`

## 样板供应器设置

`;
}

/* ── 主流程 ── */
const modelsDir = join(process.cwd(), 'models', modelDir);
const glbPath = join(modelsDir, 'scene.glb');
const modelJsonPath = join(modelsDir, 'model.json');
const docMdPath = join(modelsDir, 'doc.md');

if (!existsSync(modelsDir)) {
  mkdirSync(modelsDir, { recursive: true });
}

const meshNames = extractMeshNames(glbPath);

console.log(`找到 ${meshNames.length} 个 mesh:`);
meshNames.forEach(n => console.log(`  ${n}`));

writeFileSync(modelJsonPath, generateModelJson(modelDir, meshNames));
console.log(`\n已生成: ${modelJsonPath}`);

writeFileSync(docMdPath, generateDocMd());
console.log(`已生成: ${docMdPath}`);

console.log('\n接下来你需要手动填写:');
console.log('  1. model.json 里的 name/desc 字段');
console.log('  2. doc.md 里的 SFM 代码和样板供应器设置');
console.log('  3. labels 里的编号，按你的 SFM 程序调整');
