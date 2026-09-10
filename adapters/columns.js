// X desktop layout, observed in HomeTimeline bundle and authenticated DOM,
// 2026-09-09. X omits its secondary column at narrow viewport widths.
export const columns = Object.freeze({
  primary: '[data-testid="primaryColumn"]',
  secondary: '[data-testid="sidebarColumn"]',
});
export function hide_secondary(document) {
  const style = document.createElement('style');
  style.setAttribute('data-tap-x-secondary-hidden', '');
  style.textContent = `${columns.secondary} { display: none !important; }`;
  (document.head || document.documentElement).append(style);
  return {dispose() {style.remove();}};
}
