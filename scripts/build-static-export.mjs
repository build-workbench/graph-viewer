#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm, symlink, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const tempRoot = await mkdtemp(join(tmpdir(), 'graph-viewer-static-'));
const workDir = join(tempRoot, 'workspace');
const sourceNodeModules = join(projectRoot, 'node_modules');

// Detect repository name for basePath / 检测仓库名称用于 basePath
function getRepoName() {
  if (process.env.GITHUB_REPOSITORY) {
    const parts = process.env.GITHUB_REPOSITORY.split('/');
    if (parts.length === 2 && parts[1]) {
      return parts[1];
    }
  }
  // Default repository name / 默认仓库名称
  return 'graph-viewer';
}

const repoName = getRepoName();
const basePath = `/${repoName}`;

const excludedTopLevelNames = new Set(['.git', '.next', 'out', 'node_modules']);

function shouldCopy(src) {
  const rel = relative(projectRoot, src);
  if (!rel) return true;
  const [topLevel] = rel.split('/');
  return !excludedTopLevelNames.has(topLevel);
}

function run(command, args, cwd, env) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
      }
    });
    child.on('error', rejectPromise);
  });
}

async function rewriteCssFontUrls(outDir) {
  const cssRoot = join(outDir, '_next', 'static', 'css');
  let files = [];
  try {
    files = await readdir(cssRoot);
  } catch {
    return; // 无 CSS 目录
  }

  for (const f of files) {
    if (!f.endsWith('.css')) continue;
    const p = join(cssRoot, f);
    let css;
    try {
      css = await readFile(p, 'utf-8');
    } catch {
      continue;
    }
    // url(/fonts/) / url("/fonts/") / url('/fonts/') → url({basePath}/fonts/) — 兼容引号与空白，保留原始引号
    const rewritten = css.replace(/url\((\s*)(["']?)\/fonts\//g, `url($1$2${basePath}/fonts/`);
    if (rewritten !== css) {
      await writeFile(p, rewritten);
      console.log(`✅ Rewrote font urls in ${f}`);
    }
  }
}

async function updateManifestFile(outDir) {
  const manifestPath = join(outDir, 'manifest.json');
  
  if (!existsSync(manifestPath)) {
    console.log('⚠️ manifest.json not found, creating new one');
    return;
  }
  
  try {
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    
    // Update paths with correct basePath
    // 使用正确的 basePath 更新路径
    manifest.start_url = `${basePath}/`;
    manifest.scope = `${basePath}/`;
    
    // Update icon paths - handle both old paths and root paths
    // 更新图标路径 - 处理旧路径和根路径
    manifest.icons = manifest.icons?.map(icon => {
      let src = icon.src;
      // Replace old hardcoded basePath or add basePath to root paths
      // 替换旧的硬编码 basePath 或为根路径添加 basePath
      if (src.startsWith('/graph-viewer')) {
        src = src.replace('/graph-viewer', basePath);
      } else if (src.startsWith('/') && !src.startsWith(basePath)) {
        src = `${basePath}${src}`;
      }
      return { ...icon, src };
    }) || [
      { src: `${basePath}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }
    ];
    
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest.json with basePath: ${basePath}`);
  } catch (error) {
    console.error('❌ Failed to update manifest.json:', error.message);
  }
}

async function verifyBuildOutput(outDir) {
  console.log('\n=== Build Output Verification ===');
  
  const requiredFiles = [
    'index.html',
    '404.html',
    'editor/index.html',
    'manifest.json',
  ];
  
  for (const file of requiredFiles) {
    const filePath = join(outDir, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
    }
  }
  
  console.log(`\n📦 Repository: ${process.env.GITHUB_REPOSITORY || 'local'}`);
  console.log(`📍 Base Path: ${basePath}`);
  console.log('');
}

function resolveGitHubPagesEnv() {
  if (process.env.GITHUB_PAGES !== undefined) {
    return process.env.GITHUB_PAGES;
  }

  return process.env.LHCI === 'true' ? 'false' : 'true';
}

try {
  console.log(`🚀 Starting static export build...`);
  console.log(`📦 Repository: ${process.env.GITHUB_REPOSITORY || 'local'}`);
  console.log(`📍 Base Path: ${basePath}\n`);
  
  await cp(projectRoot, workDir, {
    recursive: true,
    filter: shouldCopy,
  });

  if (existsSync(sourceNodeModules)) {
    await symlink(sourceNodeModules, join(workDir, 'node_modules'), 'dir');
  }

  // Remove API routes for static export
  // 删除 API 路由以进行静态导出
  await rm(join(workDir, 'app', 'api'), { recursive: true, force: true });

  // Run Next.js build
  // 运行 Next.js 构建
  await run('npm', ['run', 'build'], workDir, {
    ...process.env,
    GITHUB_PAGES: resolveGitHubPagesEnv(),
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
  });

  // Update manifest.json with correct paths
  // 使用正确路径更新 manifest.json
  await updateManifestFile(join(workDir, 'out'));

  // Rewrite CSS font urls: basePath prefix
  // CSS 中字体 url(/fonts/...) 需加上 basePath 前缀, 否则部署子路径下 404
  await rewriteCssFontUrls(join(workDir, 'out'));
  
  // Copy build output to project root
  // 复制构建输出到项目根目录
  await rm(join(projectRoot, 'out'), { recursive: true, force: true });
  await cp(join(workDir, 'out'), join(projectRoot, 'out'), { recursive: true });
  
  // Verify build output
  // 验证构建输出
  await verifyBuildOutput(join(projectRoot, 'out'));
  
  console.log('✅ Static export build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
