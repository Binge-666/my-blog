import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// 颜色映射表：写死的颜色 → 主题变量
const replacements = [
  // 蓝色系 → primary
  ['text-blue-50', 'text-primary-50'],
  ['text-blue-100', 'text-primary-100'],
  ['text-blue-200', 'text-primary-200'],
  ['text-blue-300', 'text-primary-300'],
  ['text-blue-400', 'text-primary-400'],
  ['text-blue-500', 'text-primary-500'],
  ['text-blue-600', 'text-primary-600'],
  ['text-blue-700', 'text-primary-700'],
  ['text-blue-800', 'text-primary-800'],
  ['text-blue-900', 'text-primary-900'],
  ['bg-blue-50', 'bg-primary-50'],
  ['bg-blue-100', 'bg-primary-100'],
  ['bg-blue-200', 'bg-primary-200'],
  ['bg-blue-500', 'bg-primary-500'],
  ['bg-blue-600', 'bg-primary-600'],
  ['bg-blue-700', 'bg-primary-700'],
  ['border-blue-200', 'border-primary-200'],
  ['border-blue-300', 'border-primary-300'],
  ['hover:bg-blue-600', 'hover:bg-primary-600'],
  ['hover:bg-blue-700', 'hover:bg-primary-700'],
  ['hover:text-blue-600', 'hover:text-primary-600'],
  ['hover:text-blue-700', 'hover:text-primary-700'],
  ['ring-blue-500', 'ring-primary-500'],
  ['focus:ring-blue-500', 'focus:ring-primary-500'],
  ['focus:border-blue-500', 'focus:border-primary-500'],

  // 灰色系 → primary 深浅
  ['text-gray-900', 'text-primary-700'],
  ['text-gray-800', 'text-primary-700'],
  ['text-gray-700', 'text-primary-500'],
  ['text-gray-600', 'text-primary-400'],
  ['text-gray-500', 'text-primary-400'],
  ['text-gray-400', 'text-primary-300'],
  ['text-gray-300', 'text-primary-200'],
  ['bg-gray-50', 'bg-primary-50'],
  ['bg-gray-100', 'bg-primary-100'],
  ['bg-gray-200', 'bg-primary-200'],
  ['bg-gray-800', 'bg-primary-700'],
  ['bg-gray-900', 'bg-primary-700'],
  ['border-gray-100', 'border-primary-100'],
  ['border-gray-200', 'border-primary-200'],
  ['border-gray-300', 'border-primary-300'],
  ['divide-gray-200', 'divide-primary-200'],
  ['ring-gray-300', 'ring-primary-300'],
];

// 递归扫描目录
function scanDir(dir, extensions) {
  const files = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    const stat = statSync(full);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...scanDir(full, extensions));
    } else if (extensions.includes(extname(item))) {
      files.push(full);
    }
  }
  return files;
}

// 主逻辑
const srcDir = join('src');
const files = scanDir(srcDir, ['.astro', '.jsx', '.tsx']);

let totalChanges = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let changes = 0;

  for (const [from, to] of replacements) {
    // 只替换 Tailwind class 中的精确匹配
    const regex = new RegExp(`\\b${from}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      changes += matches.length;
      content = content.replace(regex, to);
    }
  }

  if (changes > 0) {
    writeFileSync(file, content);
    console.log(`  ✓ ${file} — 替换 ${changes} 处`);
    totalChanges += changes;
  }
}

console.log(`\n  共扫描 ${files.length} 个文件，替换 ${totalChanges} 处颜色`);
if (totalChanges === 0) {
  console.log('  所有文件已经是主题变量写法，无需修改');
}
