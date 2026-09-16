// Authenticated X desktop DOM. X now serves several layouts at once: the old
// one keyed posts on article[data-testid="tweet"] with a role="group" action
// row; a new Tailwind layout drops the tweet testid, the role="group" and the
// <time> permalink and uses bare aria-labels ("Share", "Bookmark"); and a mixed
// video layout renders a testid-less <article> that still carries a role="group"
// bar. Cards are any <article> owning a canonical status permalink. Per card we
// branch: a role="group" bar keeps the original row logic (untouched), otherwise
// the action bar is derived from the Share button itself.
export const cards = 'article';

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

// A node belongs to `card` when its nearest enclosing <article> is that card.
function owned(card, node) { return node?.closest?.(cards) === card; }

const SHARE_LABELS = ['Share', 'Share post'];
const BOOKMARK_TESTIDS = ['bookmark', 'removeBookmark'];
const BOOKMARK_LABELS = ['Bookmark', 'Bookmarked', 'Remove post from Bookmarks'];

function is_share(card, button) {
  return owned(card, button) && SHARE_LABELS.includes(button.getAttribute('aria-label'));
}

export function is_bookmark(card, button) {
  if (!owned(card, button)) return false;
  if (BOOKMARK_TESTIDS.includes(button.getAttribute('data-testid'))) return true;
  return BOOKMARK_LABELS.includes(button.getAttribute('aria-label'));
}

// The post's own permalink and its Views link resolve to the same canonical URL;
// the old <time> marker is gone on the new layout, so take the first owned
// status link that yields a canonical URL.
function post_url(card, base) {
  return [...card.querySelectorAll('a[href*="/status/"]')]
    .filter(link => owned(card, link))
    .map(link => canonical_post_url(link.getAttribute?.('href'), base))
    .find(Boolean) || null;
}

// Original row logic: the direct child of the role="group" bar that holds `node`.
function row_slot(row, node) {
  let slot = node;
  while (slot?.parentElement && slot.parentElement !== row) slot = slot.parentElement;
  return slot?.parentElement === row ? slot : null;
}

function bindings_from_groups(card, url, groups) {
  const bindings = [];
  for (const row of groups) {
    const share = [...row.querySelectorAll('button')].find(button => is_share(card, button));
    const anchor = row_slot(row, share);
    if (!anchor) continue;
    const bookmark = [...row.querySelectorAll('button')].find(button => is_bookmark(card, button));
    bindings.push({url, anchor, peer:share, slot:row_slot(row, bookmark) || anchor});
  }
  return bindings;
}

// New layout has no role="group": the flex cell holding `button` is found by
// walking up until a sibling child also carries an action button.
function action_cell(card, button) {
  let cell = button;
  while (cell && cell.parentElement && cell.parentElement !== card) {
    const parent = cell.parentElement;
    if ([...parent.children].some(child => child !== cell && child.querySelector?.('button'))) return cell;
    cell = parent;
  }
  return cell;
}

function bindings_from_shares(card, url) {
  const bindings = [];
  const bookmark = [...card.querySelectorAll('button')].find(button => is_bookmark(card, button));
  for (const share of [...card.querySelectorAll('button')].filter(button => is_share(card, button))) {
    const anchor = action_cell(card, share);
    if (!anchor?.parentElement) continue;
    bindings.push({url, anchor, peer:share, slot:bookmark ? action_cell(card, bookmark) : anchor});
  }
  return bindings;
}

export function select_post(card, base='https://x.com/', placement='first') {
  if (!card?.isConnected || !card.matches?.(cards)) return null;
  const url = post_url(card, base);
  if (!url) return null;
  const groups = [...card.querySelectorAll('[role="group"]')].filter(row => owned(card, row));
  const bindings = groups.length
    ? bindings_from_groups(card, url, groups)
    : bindings_from_shares(card, url);
  if (placement === 'last-multiple') return bindings.length > 1 ? bindings[bindings.length - 1] : null;
  return bindings[0] || null;
}

export function site(document) {
  return {
    cards:() => [...document.querySelectorAll(cards)],
    selected:(card, placement='first') => select_post(card, document.baseURI, placement),
  };
}
