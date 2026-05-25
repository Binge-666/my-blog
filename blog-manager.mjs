/**
 * 博客文章管理脚本 (ES模块版本)
 * 使用说明: node blog-manager.mjs [命令] [参数]
 * 命令列表:
 *   create [标题] - 创建新文章
 *   list - 列出所有文章
 *   stats - 显示博客统计
 *   help - 显示帮助信息
 */

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONTENT_DIR = path.join(__dirname, 'src/content/posts');
const TEMPLATE = `---
title: "{{title}}"
pubDate: {{date}}
description: "{{description}}"
author: "{{author}}"
tags: [{{tags}}]
---

# {{title}}

开始撰写您的内容...

## 二级标题

正文内容...

### 三级标题

更多细节...`;

// 确保内容目录存在
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// 实用函数
function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 创建readline接口
function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 提问函数
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 创建新文章
async function createPost(title) {
  const rl = createReadlineInterface();
  
  try {
    console.log('\n📝 创建新文章\n');
    
    let articleTitle = title;
    if (!articleTitle) {
      articleTitle = await askQuestion(rl, '文章标题: ');
    }
    
    const description = await askQuestion(rl, '文章描述: ') || `${articleTitle} - 文章描述`;
    const author = await askQuestion(rl, '作者: ') || '博主';
    const tagsInput = await askQuestion(rl, '标签(用逗号分隔，如: 技术,编程): ') || '未分类';
    const tags = tagsInput.split(',').map(tag => `"${tag.trim()}"`).join(', ');
    
    const slug = toSlug(articleTitle);
    const filename = `${slug}.md`;
    const filepath = path.join(CONTENT_DIR, filename);
    
    // 检查文件是否存在
    if (fs.existsSync(filepath)) {
      const overwrite = await askQuestion(rl, `文件 ${filename} 已存在，是否覆盖? (y/N): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 取消创建');
        return;
      }
    }
    
    // 生成内容
    const content = TEMPLATE
      .replace(/\{\{title\}\}/g, articleTitle)
      .replace(/\{\{date\}\}/g, formatDate(new Date()))
      .replace(/\{\{description\}\}/g, description)
      .replace(/\{\{author\}\}/g, author)
      .replace(/\{\{tags\}\}/g, tags);
    
    // 写入文件
    fs.writeFileSync(filepath, content, 'utf8');
    
    console.log(`\n✅ 文章创建成功!`);
    console.log(`📁 文件位置: ${filepath}`);
    console.log(`🔗 访问地址: http://localhost:4321/posts/${slug}`);
    console.log(`📅 发布日期: ${formatDate(new Date())}`);
    console.log(`🏷️  文章标签: ${tagsInput}`);
    
  } catch (error) {
    console.error('❌ 创建文章失败:', error.message);
  } finally {
    rl.close();
  }
}

// 列出所有文章
function listPosts() {
  console.log('\n📄 文章列表\n');
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('❌ 内容目录不存在');
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(file => file.endsWith('.md'))
    .sort();
  
  if (files.length === 0) {
    console.log('暂无文章');
    return;
  }
  
  files.forEach((file, index) => {
    const filepath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    
    // 提取frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let title = file.replace('.md', '');
    let date = '无日期';
    let tags = [];
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      const dateMatch = frontmatter.match(/pubDate:\s*([^\n]+)/);
      if (dateMatch) {
        date = dateMatch[1].trim();
      }
      
      const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
      if (tagsMatch) {
        tags = tagsMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/"/g, ''));
      }
    }
    
    const stats = fs.statSync(filepath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`${index + 1}. ${title}`);
    console.log(`   文件: ${file}`);
    console.log(`   发布日期: ${date}`);
    console.log(`   文件大小: ${sizeKB} KB`);
    console.log(`   最后修改: ${stats.mtime.toLocaleString('zh-CN')}`);
    if (tags.length > 0) {
      console.log(`   标签: ${tags.join(', ')}`);
    }
    console.log('');
  });
  
  console.log(`📊 总计: ${files.length} 篇文章`);
}

// 显示博客统计
function showStats() {
  console.log('\n📊 博客统计\n');
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('❌ 内容目录不存在');
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(file => file.endsWith('.md'));
  
  if (files.length === 0) {
    console.log('暂无文章');
    return;
  }
  
  let totalWords = 0;
  let allTags = new Set();
  let oldestDate = new Date();
  let newestDate = new Date(0);
  
  files.forEach(file => {
    const filepath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    
    // 统计字数（排除frontmatter）
    const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    const words = contentWithoutFrontmatter.trim().split(/\s+/).length;
    totalWords += words;
    
    // 提取frontmatter信息
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      // 提取发布日期
      const dateMatch = frontmatter.match(/pubDate:\s*([^\n]+)/);
      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        const date = new Date(dateStr);
        if (date < oldestDate) oldestDate = date;
        if (date > newestDate) newestDate = date;
      }
      
      // 提取标签
      const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
      if (tagsMatch) {
        const tags = tagsMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/"/g, ''))
          .filter(tag => tag);
        tags.forEach(tag => allTags.add(tag));
      }
    }
  });
  
  const avgWords = Math.round(totalWords / files.length);
  const oldestFormatted = isNaN(oldestDate.getTime()) ? '无' : oldestDate.toLocaleDateString('zh-CN');
  const newestFormatted = isNaN(newestDate.getTime()) ? '无' : newestDate.toLocaleDateString('zh-CN');
  
  console.log(`📁 文章总数: ${files.length} 篇`);
  console.log(`📝 总字数: ${totalWords.toLocaleString()} 字`);
  console.log(`📈 平均每篇: ${avgWords.toLocaleString()} 字`);
  console.log(`🏷️  标签总数: ${allTags.size} 个`);
  console.log(`📅 最早文章: ${oldestFormatted}`);
  console.log(`📅 最新文章: ${newestFormatted}`);
  console.log(`📂 内容目录: ${CONTENT_DIR}`);
  
  if (allTags.size > 0) {
    console.log(`\n🏷️  标签列表: ${Array.from(allTags).join(', ')}`);
  }
}

// 帮助信息
function showHelp() {
  console.log(`
🚀 博客文章管理工具 (ES模块版本)

使用方法: node blog-manager.mjs [命令] [参数]

命令:
  create [标题]    创建新文章
  list            列出所有文章
  stats           显示博客统计
  help            显示此帮助信息

示例:
  node blog-manager.mjs create "我的新文章"
  node blog-manager.mjs create
  node blog-manager.mjs list
  node blog-manager.mjs stats
  node blog-manager.mjs help

快捷方式（在package.json中添加scripts）:
  "scripts": {
    "post:create": "node blog-manager.mjs create",
    "post:list": "node blog-manager.mjs list",
    "post:stats": "node blog-manager.mjs stats"
  }
  `);
}

// 主函数
async function main() {
  const command = process.argv[2] || 'help';
  const arg = process.argv.slice(3).join(' ');

  switch (command) {
    case 'create':
      await createPost(arg);
      break;
    case 'list':
      listPosts();
      break;
    case 'stats':
      showStats();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// 执行主函数
main().catch((error) => {
  console.error('❌ 程序执行出错:', error.message);
  process.exit(1);
});
