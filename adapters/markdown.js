import {cards} from './posts.js';

function own_text(card) {
  const by_testid = [...card.querySelectorAll('[data-testid="tweetText"]')]
    .find(node => node.closest(cards) === card);
  if (by_testid) return by_testid;
  // The new frontend dropped the testid; the tweet body is the largest owned
  // dir="auto" block (shorter ones are the author name or an article title).
  return [...card.querySelectorAll('[dir="auto"]')]
    .filter(node => node.closest(cards) === card && (node.innerText || '').trim())
    .sort((a, b) => (b.innerText || '').length - (a.innerText || '').length)[0] || null;
}

function escape_label(text) { return text.replace(/([\\\[\]])/g, '\\$1'); }

export function render_inline(node) {
  if (node.nodeType === 3) return node.data;
  if (node.nodeType !== 1) return '';
  if (node.tagName === 'BR') return '\n';
  if (node.tagName === 'A') {
    const label = (node.innerText || node.textContent || '').trim();
    const href = node.getAttribute('href');
    if (!label || !href) return label;
    try { return `[${escape_label(label)}](${new URL(href, node.baseURI).href})`; }
    catch { return label; }
  }
  return [...node.childNodes].map(render_inline).join('');
}

export function normalize_markdown(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}

export function append_source(markdown, link) {
  const body = normalize_markdown(markdown);
  return body ? `${body}\n\n${link}` : link;
}

export function post_markdown(card, link) {
  const text = own_text(card);
  return append_source(text ? render_inline(text) : '', link);
}
