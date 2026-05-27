import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // 获取所有文章
  const postModules = import.meta.glob('../content/posts/*.md', { eager: true });
  
  const posts = Object.entries(postModules)
    .map(([filePath, module]) => {
      const slug = filePath.split('/').pop()?.replace('.md', '') || '';
      return {
        slug,
        ...module.frontmatter,
      };
    })
    .filter(post => post.title && post.pubDate && !post.draft)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return rss({
    title: 'Binge博客',
    description: '一个使用Astro构建的个人博客',
    site: context.site || 'https://your-domain.com',
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.pubDate),
      description: post.description || '',
      link: `/posts/${post.slug}/`,
    })),
    customData: '<language>zh-CN</language>',
  });
}
