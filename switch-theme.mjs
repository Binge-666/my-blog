import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const themes = {
  warm:    { name: '暖色调',   class: '' },
  forest:  { name: '森林绿',   class: 'theme-forest' },
  ocean:   { name: '深邃蓝',   class: 'theme-ocean' },
  minimal: { name: '极简黑白', class: 'theme-minimal' },
  cyber:   { name: '赛博朋克', class: 'theme-cyber' },
};

const themeName = process.argv[2];

if (!themeName || !themes[themeName]) {
  console.log('\n用法: node switch-theme.mjs <主题名>\n');
  console.log('可选主题:');
  Object.entries(themes).forEach(([key, t]) => {
    console.log(`  ${key.padEnd(10)} ${t.name}`);
  });
  console.log('');
  process.exit(0);
}

const theme = themes[themeName];

// 把主题选择写入一个 JS 文件，供页面加载时读取
const configPath = join('src', 'styles', 'theme-config.js');
const configContent = `// 自动生成，请勿手动编辑
export const currentTheme = '${theme.class}';
`;
writeFileSync(configPath, configContent);

// 同时写入一个 public 下的脚本，让浏览器读取
const publicDir = join('public');
const initScript = `// 主题初始化脚本
(function() {
  var theme = localStorage.getItem('blog-theme') || '';
  if (theme) document.documentElement.className = theme;
})();
`;

// 写到 src 下，Astro 会自动处理
const initPath = join('src', 'styles', 'theme-init.js');
writeFileSync(initPath, initScript);

// 更新 Layout 中的主题
console.log(`\n✓ 已切换到「${theme.name}」主题`);
if (theme.class) {
  console.log(`  CSS class: ${theme.class}`);
}
console.log(`  刷新浏览器即可看到效果`);
console.log(`  主题会自动保存到浏览器，无需每次切换`);
