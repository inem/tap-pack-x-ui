import {expect,test} from 'bun:test';
import {append_source,normalize_markdown,post_markdown} from '../adapters/markdown.js';

test('keeps authored Markdown and normalizes only layout whitespace', () => {
  expect(normalize_markdown('first  \r\n\r\n\r\n> quote\n\n• item  '))
    .toBe('first\n\n> quote\n\n• item');
});

test('appends the canonical source after one blank line', () => {
  expect(append_source('hello\nworld', 'https://x.com/alice/status/42'))
    .toBe('hello\nworld\n\nhttps://x.com/alice/status/42');
  expect(append_source('', 'https://x.com/alice/status/42'))
    .toBe('https://x.com/alice/status/42');
});
