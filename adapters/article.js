import {append_source,normalize_markdown,render_inline} from './markdown.js';

function text(node) {
  if (!node) return '';
  const rendered = render_inline(node);
  return normalize_markdown(rendered || node.innerText || node.textContent || '');
}

function image_url(node) {
  const image = node?.querySelector?.('img');
  const value = image?.currentSrc || image?.src || image?.getAttribute?.('src');
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value, image.baseURI);
    if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com') return null;
    return url.href;
  } catch { return null; }
}

function image_markdown(url, alt='Image') {
  return `![${alt.replace(/([\\\[\]])/g, '\\$1')}](${url})`;
}

function block_markdown(block) {
  const image = image_url(block);
  if (image) return {kind:'image', markdown:image_markdown(image)};
  const value = text(block);
  if (!value) return null;
  if (block.tagName === 'H2') return {kind:'heading', markdown:`## ${value}`};
  if (block.tagName === 'H3') return {kind:'heading', markdown:`### ${value}`};
  if (block.tagName === 'LI') {
    const classes = String(block.className || '');
    const ordered = classes.includes('ordered-list-item') && !classes.includes('unordered-list-item');
    return {kind:ordered ? 'ordered-list' : 'unordered-list', markdown:`${ordered ? '1.' : '-'} ${value}`};
  }
  if (String(block.className || '').includes('blockquote')) {
    return {kind:'quote', markdown:value.split('\n').map(line => `> ${line}`).join('\n')};
  }
  return {kind:'text', markdown:value};
}

function join_blocks(blocks) {
  return blocks.reduce((result, block, index) => {
    const previous = blocks[index - 1];
    const same_list = previous && block.kind === previous.kind && block.kind.endsWith('-list');
    return result + (index ? (same_list ? '\n' : '\n\n') : '') + block.markdown;
  }, '');
}

// X exposes an opened Article as semantic Draft blocks. Project them at the
// click boundary so text and media retain document order without fetching X.
export function article_post_markdown(card, link) {
  const article = card?.querySelector?.('[data-testid="twitterArticleReadView"]');
  const rich = article?.querySelector?.('[data-testid="longformRichTextComponent"]');
  const title = text(article?.querySelector?.('[data-testid="twitter-article-title"]'));
  if (!article || !rich || !title) return null;

  const blocks = [{kind:'title', markdown:`# ${title}`}];
  const cover = image_url(article.querySelector?.('a[href*="/article/"][href*="/media/"]'));
  if (cover) blocks.push({kind:'image', markdown:image_markdown(cover, title)});
  for (const node of rich.querySelectorAll?.('[data-block="true"]') || []) {
    const block = block_markdown(node);
    if (block) blocks.push(block);
  }
  return append_source(join_blocks(blocks), link);
}
