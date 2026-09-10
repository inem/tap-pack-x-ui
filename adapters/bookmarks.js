import {cards,select_post} from './posts.js';

function owned(card, node) { return node?.closest?.(cards) === card; }

export async function wait_for_bookmark(card, pause=delay, attempts=25) {
  for (let index=0; index<attempts; index++) {
    const saved = [...card.querySelectorAll('[data-testid="removeBookmark"]')]
      .some(button => owned(card, button));
    if (saved) return true;
    await pause(120);
  }
  return false;
}

function delay(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }

export async function persist_bookmark(bridge, link, markdown) {
  if (!bridge?.request || !markdown) return null;
  return bridge.request('x.posts', {action:'save_bookmark', link, markdown});
}

// Treat the native X state transition as acknowledgement. The click itself is
// never prevented or replayed, and unbookmarking deliberately keeps the archive.
export function save_native_bookmarks(document, bridge, project, wait=wait_for_bookmark) {
  let disposed = false;
  async function clicked(event) {
    const button = event.target?.closest?.('button[data-testid="bookmark"]');
    const card = button?.closest?.(cards);
    if (!card || !owned(card, button)) return;
    const binding = select_post(card, document.baseURI);
    if (!binding) return;
    try {
      if (!await wait(card) || disposed) return;
      const markdown = await project(card, binding.url);
      if (!markdown || disposed) return;
      await persist_bookmark(bridge, binding.url, markdown);
    } catch (error) {
      document.defaultView?.console?.warn?.('TAP could not save bookmarked X post', error);
    }
  }
  document.addEventListener('click', clicked, true);
  return {dispose() { disposed = true; document.removeEventListener('click', clicked, true); }};
}
