import {expect,test} from 'bun:test';
import {post_action_appearance} from '../adapters/appearance.js';

test('inherits the visible native action color from its inner content', () => {
  const content = {className:'native-content',querySelector:() => ({getAttribute:() => '20'})};
  const peer = {className:'native-button',firstElementChild:content};
  const document = {defaultView:{getComputedStyle:node => ({
    color:node === content ? 'rgb(113, 118, 123)' : 'rgb(231, 233, 234)',
  })}};
  expect(post_action_appearance(document, peer)).toEqual({
    buttonClass:'native-button', contentClass:'native-content', iconClass:'',
    iconSize:'20', iconColor:'rgb(113, 118, 123)',
  });
});
