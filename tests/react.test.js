import {expect,test} from 'bun:test';
import {react_post_markdown} from '../adapters/react.js';

test('projects complete note text from the post React model without a UI transition', () => {
  const card = {};
  card.__reactFiber$fixture = {return:{memoizedProps:{model:{
    __typename:'Tweet',rest_id:'42',legacy:{full_text:'legacy excerpt'},
    note_tweet:{note_tweet_results:{result:{text:'complete note text'}}},
  }}}};
  expect(react_post_markdown(card, 'https://x.com/alice/status/42'))
    .toBe('complete note text\n\nhttps://x.com/alice/status/42');
});

test('rejects a different post identity and missing React bindings', () => {
  const card = {__reactProps$fixture:{tweet:{
    __typename:'Tweet',rest_id:'99',legacy:{full_text:'other post'},
  }}};
  expect(react_post_markdown(card, 'https://x.com/alice/status/42')).toBeNull();
  expect(react_post_markdown({}, 'https://x.com/alice/status/42')).toBeNull();
});

test('finds a Tweet model attached to a descendant host node', () => {
  const child = {__reactProps$fixture:{tweet:{
    __typename:'Tweet',rest_id:'42',legacy:{full_text:'complete child text'},
  }}};
  const card = {querySelectorAll:() => [child]};
  expect(react_post_markdown(card, 'https://x.com/alice/status/42'))
    .toBe('complete child text\n\nhttps://x.com/alice/status/42');
});
