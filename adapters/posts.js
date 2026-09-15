// Authenticated X desktop DOM. The 2026-09-09 layout keyed posts on
// article[data-testid="tweet"] with a role="group" action row whose buttons
// carried aria-label="Share post" and data-testid bookmarks. In 2026-09 X
// shipped a new frontend where the tweet <article> carries no data-testid and
// the action bar has no role="group"; buttons expose bare aria-labels
// ("Share", "Bookmark"). Both are supported: a card is any <article> that owns
// a canonical status permalink, and the action bar is derived from the Share
// button itself rather than a role="group" container.
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
// Quoted posts are their own nested <article> and are scoped out naturally.
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

// The flex cell holding `button` inside its action bar: walk up until a sibling
// child also carries an action button — that parent is the bar and the current
// node is its cell. Works for the old role="group" row and the new flex bar.
function action_cell(card, button) {
  let cell = button;
  while (cell && cell.parentElement && cell.parentElement !== card) {
    const parent = cell.parentElement;
    const sibling_action = [...parent.children]
      .some(child => child !== cell && child.querySelector?.('button'));
    if (sibling_action) return cell;
    cell = parent;
  }
  return cell;
}

export function select_post(card, base='https://x.com/', placement='first') {
  if (!card?.isConnected || !card.matches?.(cards)) return null;
  // The old layout marked the permalink with a <time> child; the new frontend
  // dropped <time> and renders the timestamp as text. The post's own permalink
  // and its Views link resolve to the same canonical URL, so take the first
  // owned status link that yields one — no <time> dependency.
  const url = [...card.querySelectorAll('a[href*="/status/"]')]
    .filter(link => owned(card, link))
    .map(link => canonical_post_url(link.getAttribute?.('href'), base))
    .find(Boolean) || null;
  if (!url) return null;
  // One Share button per action bar; a full Article has bars above and below.
  const shares = [...card.querySelectorAll('button')].filter(button => is_share(card, button));
  const bindings = [];
  for (const share of shares) {
    const anchor = action_cell(card, share);
    if (!anchor?.parentElement) continue;
    const bookmark = [...card.querySelectorAll('button')].find(button => is_bookmark(card, button));
    // Borrow the Bookmark cell geometry when present for one-line placement.
    bindings.push({url, anchor, peer:share, slot:bookmark ? action_cell(card, bookmark) : anchor});
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
