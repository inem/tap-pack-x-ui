export function post_action_appearance(document, peer) {
  const content = peer.firstElementChild;
  return {
    buttonClass:peer.className,
    contentClass:content?.className || '',
    iconClass:'',
    iconSize:content?.querySelector('svg')?.getAttribute('width') || 20,
    iconColor:document.defaultView?.getComputedStyle?.(content || peer)?.color || '',
  };
}
