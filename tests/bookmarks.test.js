import {expect,test} from 'bun:test';
import {persist_bookmark,wait_for_bookmark} from '../adapters/bookmarks.js';

test('persists confirmed bookmark Markdown through the independent x.posts capability', async () => {
  const bridge = {request:async (handler,args) => {
    expect(handler).toBe('x.posts');
    expect(args).toEqual({action:'save_bookmark',link:'https://x.com/alice/status/42',
      markdown:'Complete post\n\nhttps://x.com/alice/status/42'});
    return {saved:true,path:'readable/bookmarks/42.md'};
  }};
  expect(await persist_bookmark(bridge, 'https://x.com/alice/status/42',
    'Complete post\n\nhttps://x.com/alice/status/42')).toEqual({saved:true,path:'readable/bookmarks/42.md'});
});

test('waits for X to acknowledge Bookmark as removeBookmark', async () => {
  const card = {matches:() => true};
  const saved = {closest:() => card};
  let attempts = 0;
  card.querySelectorAll = () => ++attempts >= 3 ? [saved] : [];
  expect(await wait_for_bookmark(card, async () => {}, 4)).toBe(true);
  expect(attempts).toBe(3);
});

test('does not persist without a local bridge or material', async () => {
  expect(await persist_bookmark(null, 'https://x.com/alice/status/42', 'text')).toBeNull();
  expect(await persist_bookmark({request:async()=>{throw new Error('unexpected');}},
    'https://x.com/alice/status/42', null)).toBeNull();
});
