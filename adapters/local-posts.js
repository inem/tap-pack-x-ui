import {append_source} from './markdown.js';

export async function local_post_markdown(bridge, link) {
  if (!bridge?.request) return null;
  try {
    const value = await bridge.request('x.posts', {link});
    return typeof value?.text === 'string' && value.text ? append_source(value.text, link) : null;
  } catch { return null; }
}
