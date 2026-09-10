import {expect,test} from 'bun:test';
import {canonical_post_url,select_post} from '../adapters/posts.js';

test('canonicalizes an X timestamp link without tracking parameters', () => {
  expect(canonical_post_url('/alice/status/123456789?s=20')).toBe('https://x.com/alice/status/123456789');
  expect(canonical_post_url('https://www.x.com/Alice/status/42/')).toBe('https://x.com/Alice/status/42');
});

test('rejects foreign, analytics, malformed and generic web status URLs', () => {
  expect(canonical_post_url('https://example.com/alice/status/42')).toBeNull();
  expect(canonical_post_url('/alice/status/42/analytics')).toBeNull();
  expect(canonical_post_url('/alice/status/not-a-number')).toBeNull();
  expect(canonical_post_url('/i/status/42')).toBeNull();
});

test('binds only the card own timestamp and Share row', () => {
  const card = {isConnected:true,matches:selector => selector.includes('article')};
  const quoted = {closest:() => ({})};
  const time = {closest:() => card,querySelector:selector => selector === 'time' ? {} : null,
    getAttribute:() => '/alice/status/42'};
  const row = {closest:() => card};
  const lane = {parentElement:row,className:'share-lane'};
  const wrapper = {parentElement:lane,className:'share-wrapper'};
  const bookmarkSlot = {parentElement:row,className:'native-slot'};
  const share = {closest:() => card,parentElement:wrapper,getAttribute:name => name === 'aria-label' ? 'Share post' : null};
  const bookmark = {closest:() => card,parentElement:bookmarkSlot,getAttribute:name => name === 'data-testid' ? 'bookmark' : null};
  row.querySelectorAll=selector => selector === 'button' ? [bookmark,share] : [];
  card.querySelectorAll=selector => selector.startsWith('a[') ? [quoted,time] : [row];
  expect(select_post(card)).toEqual({url:'https://x.com/alice/status/42',anchor:lane,peer:share,slot:bookmarkSlot});
  expect(select_post(card, 'https://x.com/', 'last-multiple')).toBeNull();
});

test('keeps the native bookmark slot after X changes bookmark to removeBookmark', () => {
  const card = {isConnected:true,matches:selector => selector.includes('article')};
  const time = {closest:() => card,querySelector:selector => selector === 'time' ? {} : null,
    getAttribute:() => '/alice/status/42'};
  const row = {closest:() => card};
  const shareSlot = {parentElement:row,className:'share-slot'};
  const bookmarkSlot = {parentElement:row,className:'bookmark-slot'};
  const share = {closest:() => card,parentElement:shareSlot,
    getAttribute:name => name === 'aria-label' ? 'Share post' : null};
  const removeBookmark = {closest:() => card,parentElement:bookmarkSlot,
    getAttribute:name => name === 'data-testid' ? 'removeBookmark' : null};
  row.querySelectorAll=selector => selector === 'button' ? [removeBookmark,share] : [];
  card.querySelectorAll=selector => selector.startsWith('a[') ? [time] : [row];
  expect(select_post(card)).toEqual({
    url:'https://x.com/alice/status/42',anchor:shareSlot,peer:share,slot:bookmarkSlot,
  });
});

test('binds the last action row only when an Article exposes two rows', () => {
  const card = {isConnected:true,matches:selector => selector.includes('article')};
  const time = {closest:() => card,querySelector:selector => selector === 'time' ? {} : null,
    getAttribute:() => '/alice/status/42'};
  function action_row(name) {
    const row = {closest:() => card};
    const slot = {parentElement:row,className:name};
    const share = {closest:() => card,parentElement:slot,
      getAttribute:key => key === 'aria-label' ? 'Share post' : null};
    row.querySelectorAll=selector => selector === 'button' ? [share] : [];
    return {row,slot,share};
  }
  const upper = action_row('upper');
  const lower = action_row('lower');
  card.querySelectorAll=selector => selector.startsWith('a[') ? [time] : [upper.row,lower.row];
  expect(select_post(card, 'https://x.com/', 'last-multiple')).toEqual({
    url:'https://x.com/alice/status/42',anchor:lower.slot,peer:lower.share,slot:lower.slot,
  });
});
