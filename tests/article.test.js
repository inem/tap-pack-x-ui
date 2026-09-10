import {expect,test} from 'bun:test';
import {article_post_markdown} from '../adapters/article.js';

function text_node(value) { return {nodeType:3,data:value}; }
function element(tag, value='', options={}) {
  return {
    nodeType:1, tagName:tag, className:options.className || '',
    childNodes:value ? [text_node(value)] : [], innerText:value, textContent:value,
    querySelector:options.querySelector || (() => null),
    querySelectorAll:options.querySelectorAll || (() => []),
  };
}
function image(src) {
  const img = {currentSrc:src,baseURI:'https://x.com/'};
  return element('SECTION','',{querySelector:selector => selector === 'img' ? img : null});
}

test('projects an opened X Article with cover and inline images in document order', () => {
  const blocks = [
    element('DIV','Opening paragraph.'),
    image('https://pbs.twimg.com/media/inline.jpg?format=jpg&name=medium'),
    element('H2','Build it'),
    element('LI','First step',{className:'longform-unordered-list-item'}),
    element('LI','Second step',{className:'longform-unordered-list-item'}),
  ];
  const title = element('DIV','One Person Media');
  const cover = image('https://pbs.twimg.com/media/cover.jpg?format=jpg&name=medium');
  const rich = element('DIV','',{querySelectorAll:selector => selector === '[data-block="true"]' ? blocks : []});
  const article = element('ARTICLE','',{querySelector:selector => ({
    '[data-testid="twitter-article-title"]':title,
    '[data-testid="longformRichTextComponent"]':rich,
    'a[href*="/article/"][href*="/media/"]':cover,
  })[selector] || null});
  const card = {querySelector:selector => selector === '[data-testid="twitterArticleReadView"]' ? article : null};

  expect(article_post_markdown(card, 'https://x.com/alice/status/42')).toBe(
    '# One Person Media\n\n' +
    '![One Person Media](https://pbs.twimg.com/media/cover.jpg?format=jpg&name=medium)\n\n' +
    'Opening paragraph.\n\n' +
    '![Image](https://pbs.twimg.com/media/inline.jpg?format=jpg&name=medium)\n\n' +
    '## Build it\n\n- First step\n- Second step\n\n' +
    'https://x.com/alice/status/42');
});

test('does not claim ordinary posts or incomplete Article previews', () => {
  expect(article_post_markdown({}, 'https://x.com/alice/status/42')).toBeNull();
  const card = {querySelector:() => element('ARTICLE','')};
  expect(article_post_markdown(card, 'https://x.com/alice/status/42')).toBeNull();
});
