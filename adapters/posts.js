// Authenticated X desktop DOM, observed on a post and its action rows,
// 2026-09-09. Identity comes from the post's own timestamp permalink.
export const cards = 'article[data-testid="tweet"]';

export function canonical_post_url(href, base='https://x.com/') {
  if (typeof href !== 'string' || !href) return null;
  try {
    const url = new URL(href, base);
    if (url.protocol !== 'https:' || !['x.com','www.x.com'].includes(url.hostname)) return null;
    const match = /^\/([^/]+)\/status\/(\d+)$/.exec(url.pathname.replace(/\/$/,''));
    if (!match || match[1].toLowerCase() === 'i') return null;
    return `https://x.com/${match[1]}/status/${match[2]}`;
  } catch { return null; }
}

function owned(card, node) { return node?.closest?.(cards) === card; }

function row_slot(row, node) {
  let slot = node;
  while (slot?.parentElement && slot.parentElement !== row) slot = slot.parentElement;
  return slot?.parentElement === row ? slot : null;
}

export function select_post(card, base='https://x.com/', placement='first') {
  if (!card?.isConnected || !card.matches?.(cards)) return null;
  const timestamp = [...card.querySelectorAll('a[href*="/status/"]')]
    .find(link => owned(card, link) && link.querySelector?.('time'));
  const url = canonical_post_url(timestamp?.getAttribute?.('href'), base);
  if (!url) return null;
  const rows = [...card.querySelectorAll('[role="group"]')].filter(row => owned(card, row));
  const bindings = [];
  for (const row of rows) {
    const share = [...row.querySelectorAll('button')]
      .find(button => owned(card, button) && button.getAttribute('aria-label') === 'Share post');
    const anchor = row_slot(row, share);
    if (!anchor) continue;
    const bookmark = [...row.querySelectorAll('button')]
      .find(button => owned(card, button) &&
        ['bookmark','removeBookmark'].includes(button.getAttribute('data-testid')));
    // Feed and article layouts wrap Share differently. Mount at the row level,
    // borrowing the ordinary Bookmark slot when available for one-line geometry.
    bindings.push({url, anchor, peer:share, slot:row_slot(row, bookmark) || anchor});
  }
  if (placement === 'last-multiple') return bindings.length > 1 ? bindings[bindings.length - 1] : null;
  return bindings[0] || null;
}

export function site(document) {
  return {
    cards:() => [...document.querySelectorAll(cards)],
    selected:(card, placement='first') => select_post(card, document.baseURI, placement),
  };
}
