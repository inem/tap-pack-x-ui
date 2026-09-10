// X keeps Copy link in the Share menu. Once the direct action exists, hide only
// that duplicate entry; all other sharing choices remain native and untouched.
export function deduplicate_copy_menu(document) {
  const marker = 'data-tap-x-copy-menu-item';
  const style = document.createElement('style');
  style.textContent = `[${marker}] { display:none !important; }`;
  (document.head || document.documentElement).append(style);
  const marked = new Set();
  let pending = false, disposed = false;
  function refresh() {
    if (disposed) return;
    const available = Boolean(document.querySelector('[data-tap-x-copy]'));
    const current = new Set(available ? [...document.querySelectorAll('[role="menuitem"]')]
      .filter(item => (item.textContent || '').trim() === 'Copy link') : []);
    for (const item of marked) if (!current.has(item)) {item.removeAttribute(marker);marked.delete(item);}
    for (const item of current) if (!marked.has(item)) {item.setAttribute(marker, '');marked.add(item);}
  }
  const observer = new document.defaultView.MutationObserver(() => {
    if (pending || disposed) return;
    pending = true;
    queueMicrotask(() => {pending=false;refresh();});
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true});
  refresh();
  return {refresh, dispose() {disposed=true;observer.disconnect();style.remove();
    for (const item of marked) item.removeAttribute(marker);marked.clear();}};
}
