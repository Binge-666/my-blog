# 博客更新清单

## 已完成

### 暗黑模式修复
- [x] 为每个主题（暖色调、森林绿、深邃蓝、极简黑白、赛博朋克、中文排版、技术博客、杂志风格、简约灰）设计专属暗黑模式配色
- [x] 所有页面卡片 `bg-white` 改成 `bg-primary-100`，适配暗黑模式
- [x] 导航栏、页脚、下拉框、按钮适配暗黑模式
- [x] 文章内容区域硬编码颜色改用 CSS 变量

### 主题区分
- [x] 简约灰改成冷色调（蓝灰色+青绿色），与极简黑白（纯灰色）明显区分

### 评论系统
- [x] 创建 Waline 评论组件 (`src/components/Waline.astro`)
- [x] 创建组合评论组件，支持切换 Giscus 和 Waline (`src/components/Comments.astro`)
- [x] 文章页使用新的 Comments 组件

## 明天继续：部署 Waline 服务端

### 目标
在 GitHub 创建一个简单的 Waline 服务器仓库，部署到 Vercel。

### 步骤

1. 打开 https://github.com/new
2. Repository name 填 `waline`（全小写），选 Public，点 Create
3. 创建三个文件：

**文件 1：`package.json`**
```json
{
  "name": "waline",
  "private": true,
  "dependencies": {
    "@waline/vercel": "^3"
  }
}
```

**文件 2：`api/index.js`**
```js
module.exports = require('@waline/vercel');
```

**文件 3：`vercel.json`**
```json
{
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.js" }
  ]
}
```

4. 创建好后打开 https://vercel.com/new/clone，填入仓库地址部署
5. 部署成功后会得到一个 URL（如 `https://xxx.vercel.app`）
6. 把 URL 告诉我，我更新到博客代码里的 Waline 组件中

### Waline 部署成功后还需要做的
- [ ] 在 Waline 管理后台设置密码（访问 `你的URL/ui`）
- [ ] 测试评论功能是否正常
- [ ] 确认评论审核功能

### 博客地址
- GitHub: https://github.com/Binge-666/my-blog
- Vercel: https://my-blog-sigma-red.vercel.app
