#!/usr/bin/env node
/**
 * Astro 博客主题安装脚本
 * 用法: node install-theme.mjs
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';

// ==================== 配置区 ====================
const CONFIG = {
  projectDir: resolve('.'),
  backupDir: resolve('..', 'my-blog-backup'),
  theme: {
    // 与原指南不同的视觉风格：暖色调
    primaryColor: 'amber',     // 原指南用 blue
    secondaryColor: 'rose',    // 原指南用 purple
    accentColor: 'emerald',    // 原指南用 sky
    fontHeading: "'ZCOOL XiaoWei', serif",   // 原指南用 Inter
    fontBody: "'Noto Sans SC', sans-serif",   // 原指南用 system-ui
    fontMono: "'Fira Code', monospace",       // 原指南用 JetBrains Mono
    darkMode: 'class',
  },
  site: {
    title: '我的技术博客',
    description: '分享技术思考、开发经验和学习笔记',
    author: '博主',
    url: 'https://yourblog.example.com',
  },
};

// ==================== 工具函数 ====================
const log = {
  banner: (text) => console.log(`\n${'━'.repeat(50)}\n  ${text}\n${'━'.repeat(50)}`),
  step: (text) => console.log(`\n▸ ${text}`),
  ok: (text) => console.log(`  ✓ ${text}`),
  fail: (text) => console.log(`  ✗ ${text}`),
  info: (text) => console.log(`  · ${text}`),
};

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${question} (Y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', cwd: CONFIG.projectDir });
    return true;
  } catch {
    return false;
  }
}

// ==================== 步骤一：环境检查 ====================
function checkEnvironment() {
  log.banner('环境检查');

  const checks = [
    { name: '项目目录', path: CONFIG.projectDir },
    { name: 'package.json', path: join(CONFIG.projectDir, 'package.json') },
    { name: 'src 目录', path: join(CONFIG.projectDir, 'src') },
    { name: 'node_modules', path: join(CONFIG.projectDir, 'node_modules') },
  ];

  let allOk = true;
  for (const { name, path: p } of checks) {
    if (existsSync(p)) {
      log.ok(`${name} 已就绪`);
    } else {
      log.fail(`${name} 不存在: ${p}`);
      if (name === '项目目录' || name === 'package.json') allOk = false;
    }
  }

  if (!allOk) {
    console.error('\n关键文件缺失，请检查项目路径。');
    process.exit(1);
  }

  log.info(`项目路径: ${CONFIG.projectDir}`);
  log.info(`备份路径: ${CONFIG.backupDir}`);
}

// ==================== 步骤二：备份 ====================
async function createBackup() {
  log.banner('备份当前项目');

  if (!await ask('是否创建项目备份？')) {
    log.info('已跳过备份');
    return;
  }

  if (existsSync(CONFIG.backupDir)) {
    log.info('备份目录已存在，将覆盖');
  }

  try {
    cpSync(CONFIG.projectDir, CONFIG.backupDir, {
      recursive: true,
      filter: (src) => !src.includes('node_modules'),
    });
    log.ok(`备份完成 → ${CONFIG.backupDir}`);
  } catch (err) {
    log.fail(`备份失败: ${err.message}`);
    if (!await ask('是否继续安装？')) process.exit(1);
  }
}

// ==================== 步骤三：安装依赖 ====================
async function installDependencies() {
  log.banner('安装主题依赖');

  const packages = [
    { name: '@astrojs/theme-blog', desc: '官方博客主题' },
    // 删掉 @astrojs/tailwind，换成下面两个
    { name: 'tailwindcss', desc: 'Tailwind CSS v4 核心' },
    { name: '@tailwindcss/vite', desc: 'Tailwind Vite 插件（适配 Astro v6）' },
    // typography 和 forms 在 v4 中已内置，不再需要单独安装
  ];
  

  console.log('\n  将安装以下包:');
  packages.forEach((p, i) => log.info(`${i + 1}. ${p.name} — ${p.desc}`));

  if (!await ask('确认安装？')) {
    log.info('已取消');
    return;
  }

  // 一次性安装，比逐个安装更快
  const names = packages.map((p) => p.name).join(' ');
  log.step('正在安装...');
  if (!run(`npm install ${names}`)) {
    log.fail('安装失败，请检查网络或 npm 配置');
    process.exit(1);
  }
  log.ok('全部依赖安装成功');
}

// ==================== 步骤四：生成配置文件 ====================
async function generateConfigs() {
  log.banner('生成配置文件');

  if (!await ask('是否生成主题配置文件？')) {
    log.info('已跳过');
    return;
  }

  // ---- astro.config.mjs ----
  log.step('写入 astro.config.mjs');
  const astroConfig = `import { defineConfig } from 'astro/config';
import blog from '@astrojs/theme-blog';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: '${CONFIG.site.url}',
  base: '/',
  trailingSlash: 'ignore',

  integrations: [
    blog({
      title: '${CONFIG.site.title}',
      description: '${CONFIG.site.description}',
      author: '${CONFIG.site.author}',
      social: {
        github: 'https://github.com/yourusername',
        email: 'contact@yourblog.dev',
      },
      navigation: [
        { href: '/', label: '首页' },
        { href: '/posts', label: '文章' },
        { href: '/tags', label: '标签' },
        { href: '/about', label: '关于' },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
});
`;
  writeFileSync(join(CONFIG.projectDir, 'astro.config.mjs'), astroConfig);
  log.ok('astro.config.mjs');

  // ---- tailwind.config.mjs ----
  

  // ---- src/styles/global.css ----
  // ---- src/styles/global.css ----
log.step('写入 src/styles/global.css');
const stylesDir = join(CONFIG.projectDir, 'src', 'styles');
if (!existsSync(stylesDir)) mkdirSync(stylesDir, { recursive: true });

const globalCss = `@import "tailwindcss";

@theme {
  --color-primary-50: #fffbeb;
  --color-primary-100: #fef3c7;
  --color-primary-200: #fde68a;
  --color-primary-300: #fcd34d;
  --color-primary-400: #fbbf24;
  --color-primary-500: #f59e0b;
  --color-primary-600: #d97706;
  --color-primary-700: #b45309;
  --color-primary-800: #92400e;
  --color-primary-900: #78350f;

  --color-secondary-50: #fff1f2;
  --color-secondary-100: #ffe4e6;
  --color-secondary-500: #f43f5e;
  --color-secondary-600: #e11d48;
  --color-secondary-700: #be123c;

  --font-heading: 'ZCOOL XiaoWei', serif;
  --font-body: 'Noto Sans SC', sans-serif;
  --font-mono: 'Fira Code', monospace;
}

@layer base {
  :root {
    --color-bg: #fffbf5;
    --color-surface: #fff8ee;
    --color-text: #292524;
    --color-text-muted: #78716c;
    --color-border: #e7e5e4;
  }
  .dark {
    --color-bg: #1c1917;
    --color-surface: #292524;
    --color-text: #fafaf9;
    --color-text-muted: #a8a29e;
    --color-border: #44403c;
  }
  html {
    scroll-behavior: smooth;
    font-family: var(--font-body);
  }
  body {
    background: var(--color-bg);
    color: var(--color-text);
    -webkit-font-smoothing: antialiased;
  }
}

@layer components {
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(to right, #f59e0b, #f43f5e);
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  .btn-primary:hover {
    background: linear-gradient(to right, #d97706, #e11d48);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  }
}
`;

writeFileSync(join(stylesDir, 'global.css'), globalCss);
log.ok('src/styles/global.css');


  log.info('所有配置文件已生成');
}

// ==================== 步骤五：验证与测试 ====================
async function verifyAndTest() {
  log.banner('验证安装');

  // 验证关键文件
  const required = [
    'astro.config.mjs',
    'tailwind.config.mjs',
    'src/styles/global.css',
  ];

  let allPresent = true;
  for (const file of required) {
    if (existsSync(join(CONFIG.projectDir, file))) {
      log.ok(file);
    } else {
      log.fail(`${file} 缺失`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    log.fail('部分文件缺失，安装可能不完整');
    return;
  }

  if (await ask('是否启动开发服务器预览？')) {
    log.step('启动开发服务器...');
    log.info('访问地址: http://localhost:4321');
    log.info('按 Ctrl+C 停止');
    run('npm run dev');
  }
}

// ==================== 恢复说明 ====================
function printRecovery() {
  log.banner('安装完成 · 后续操作');

  console.log(`
  后续可自定义的文件:
    配置  →  astro.config.mjs
    主题  →  tailwind.config.mjs
    样式  →  src/styles/global.css

  常用命令:
    npm run dev      启动开发服务器
    npm run build    构建生产版本
    npm run preview  预览构建结果

  如需恢复原始项目:
    1. 删除当前项目目录
    2. 将 ${CONFIG.backupDir} 重命名为 my-blog
    3. 一切恢复原样
  `);
}

// ==================== 主流程 ====================
async function main() {
  console.log(`
  ╔══════════════════════════════════════╗
  ║    Astro 博客主题安装器 v1.0         ║
  ║    跨平台 · Node.js 版               ║
  ╚══════════════════════════════════════╝
  `);

  checkEnvironment();
  await createBackup();
  await installDependencies();
  await generateConfigs();
  await verifyAndTest();
  printRecovery();
}

main().catch((err) => {
  log.fail(`意外错误: ${err.message}`);
  process.exit(1);
});
