import {expect,test} from 'bun:test';
import {local_post_markdown} from '../adapters/local-posts.js';

test('projects text supplied by the independent local posts capability', async () => {
  const bridge = {request:async (handler,args) => {
    expect(handler).toBe('x.posts');
    expect(args).toEqual({link:'https://x.com/alice/status/42'});
    return {text:'complete captured text'};
  }};
  expect(await local_post_markdown(bridge, 'https://x.com/alice/status/42'))
    .toBe('complete captured text\n\nhttps://x.com/alice/status/42');
});

test('is optional when unavailable', async () => {
  expect(await local_post_markdown(null, 'https://x.com/alice/status/42')).toBeNull();
  expect(await local_post_markdown({request:async()=>{throw new Error('not_found');}},
    'https://x.com/alice/status/42')).toBeNull();
});
