import {append_source} from './markdown.js';

function status_id(link) {
  try { return /^\/[^/]+\/status\/(\d+)$/.exec(new URL(link).pathname)?.[1] || null; }
  catch { return null; }
}

function tweet_text(tweet) {
  const note = tweet?.note_tweet?.note_tweet_results?.result?.text;
  if (typeof note === 'string' && note) return note;
  const legacy = tweet?.legacy?.full_text;
  return typeof legacy === 'string' && legacy ? legacy : null;
}

function find_tweet(root, id, budget=12000) {
  const queue = [root], seen = new Set();
  while (queue.length && budget-- > 0) {
    const value = queue.shift();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    if (value.__typename === 'Tweet' && value.rest_id === id && tweet_text(value)) return value;
    if (value.nodeType || value === value.window) continue;
    if (Array.isArray(value)) {queue.push(...value);continue;}
    for (const [key, child] of Object.entries(value)) {
      if (key === '_owner' || key === 'return' || key === 'child' || key === 'sibling' || key === 'stateNode') continue;
      if (child && typeof child === 'object') queue.push(child);
    }
  }
  return null;
}

// React keeps the supplied Tweet model above the host article. Read it only at
// the action boundary; never retain fibers or modify component state.
export function react_post_markdown(card, link) {
  const id = status_id(link);
  if (!id) return null;
  const nodes = [card, ...(card.querySelectorAll?.('*') || [])];
  const seen_fibers = new Set();
  for (const node of nodes.slice(0, 500)) {
    const names = Object.getOwnPropertyNames(node);
    const props_name = names.find(name => name.startsWith('__reactProps$'));
    const roots = props_name ? [node[props_name]] : [];
    const fiber_name = names.find(name => name.startsWith('__reactFiber$'));
    let fiber = fiber_name ? node[fiber_name] : null;
    for (let depth=0; fiber && depth<32 && !seen_fibers.has(fiber); depth++, fiber=fiber.return) {
      seen_fibers.add(fiber);
      roots.push(fiber.memoizedProps, fiber.pendingProps, fiber.memoizedState);
    }
    for (const root of roots) {
      const tweet = find_tweet(root, id);
      if (tweet) return append_source(tweet_text(tweet), link);
    }
  }
  return null;
}
