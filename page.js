import {copy_link} from 'tap-pack-sdk/copy';
import {browser_clipboard} from 'tap-pack-sdk/dom';
import {mount_action} from 'tap-pack-sdk/ui';
import {article_post_markdown} from './adapters/article.js';
import {save_native_bookmarks} from './adapters/bookmarks.js';
import {hide_secondary} from './adapters/columns.js';
import {local_post_markdown} from './adapters/local-posts.js';
import {deduplicate_copy_menu} from './adapters/menu.js';
import {post_actions} from './adapters/post-ui.js';
import {site} from './adapters/posts.js';
import {react_post_markdown} from './adapters/react.js';

const key = '__tap_x_ui';
window[key]?.dispose();
const posts = site(document);
const clipboard = browser_clipboard(navigator, document);
const copyAction = {
    label:'Copy post link',
    icon:'link',
    marker:'data-tap-x-copy',
    messages:{pending:'Copying link…', completed:'Post link copied', failed:'Could not copy — try again'},
};
const markdownAction = {
    label:'Copy post as Markdown',
    icon:'markdown',
    marker:'data-tap-x-copy-markdown',
    messages:{pending:'Copying Markdown…', completed:'Markdown copied', failed:'Could not copy — try again'},
};
async function markdown_for(post, link) {
  const article = article_post_markdown(post, link);
  if (article) return article;
  const local = await local_post_markdown(window.TapBridge, link);
  return local || react_post_markdown(post, link);
}
const copy = ['first','last-multiple'].map(placement => mount_action({
  root:document.documentElement,
  ...post_actions(document, copyAction, posts, placement),
  run:post => copy_link(() => post.link, clipboard),
}));
const markdown = ['first','last-multiple'].map(placement => mount_action({
  root:document.documentElement,
  ...post_actions(document, markdownAction, posts, placement),
  run:post => clipboard.writeTextDeferred(async () => {
    const complete = await markdown_for(post.object, post.link);
    if (!complete) throw new Error('Complete post text is not available yet');
    return complete;
  }),
}));
const bookmarks = save_native_bookmarks(document, window.TapBridge, markdown_for);
const menu = deduplicate_copy_menu(document);
const secondary = hide_secondary(document);

window[key] = {dispose() {
  menu.dispose();
  bookmarks.dispose();
  for (const action of [...markdown,...copy]) action.dispose();
  secondary.dispose();
}};
