import {action_button} from 'tap-pack-sdk/ui';
import {post_action_appearance} from './appearance.js';
import {site} from './posts.js';

// Keep the site's wrapper and button geometry, but own all behavior and SVG.
// The SVG deliberately borrows no X icon class: X's native class forces fill,
// while the SDK link symbol is a stroked icon.
function present_action(document, action, binding) {
  const wrapper = document.createElement('div');
  const view = action_button(document, {...action, appearance:post_action_appearance(document, binding.peer)});
  if (action.marker) view.element.setAttribute(action.marker, '');
  function sync(next) {
    wrapper.className = next.slot.className;
    view.appearance(post_action_appearance(document, next.peer));
  }
  sync(binding);
  wrapper.append(view.element);
  return {element:wrapper, state:view.state, sync, dispose() {view.dispose();wrapper.remove();}};
}

export function post_actions(document, action, posts=site(document), placement='first') {
  return {
    targets:posts.cards,
    resolve(post) {
      const found = posts.selected(post, placement);
      return found && {key:found.url, anchor:found.anchor, peer:found.peer, slot:found.slot,
        link:found.url, object:post};
    },
    present:binding => present_action(document, action, binding),
    attributes:['data-testid','aria-label','class'],
  };
}
