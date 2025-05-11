import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { unified } from 'unified';

import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

import { removePosition } from 'unist-util-remove-position';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';

import type { Code, InlineCode, List, Root } from 'mdast';
import type { InlineMath, Math as MdastMath } from 'mdast-util-math';

import remarkTypopo from '../src/index.js';

const run = (md: string, options = {}) =>
  unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkTypopo, options)
    .use(remarkStringify)
    .processSync(md);

const parse = (md: string): Root => {
  const tree = unified().use(remarkParse).use(remarkMath).parse(md) as Root;
  removePosition(tree, { force: true });
  return tree;
};

describe('remark-typopo', () => {
  it('fixes straight quotes in plain text', () => {
    const out = run(`"hello"`);
    assert.equal(String(out), '“hello”\n');
  });

  it('serialises to equivalent Markdown', () => {
    const src = 'Normal **strong** and *emphasis* text.';
    const out = String(run(src));
    assert.equal(out, `${src}\n`); // `remark-stringify` adds final newline
  });

  it('does not alter code or math nodes by default', () => {
    const input = [
      '`code "quotes"` and',
      '```js',
      'const x = "block"',
      '```',
      '$$ y = "math" $$',
      '$ z = "inline_math" $',
    ].join('\n');

    const tree = parse(String(run(input)));
    const captured: string[] = [];

    visit(tree, ['inlineCode', 'code', 'math', 'inlineMath'], (node) => {
      captured.push((node as InlineCode | Code | MdastMath | InlineMath).value);
    });

    assert.deepStrictEqual(
      captured.map((v) => v.trimEnd()),
      ['code "quotes"', 'const x = "block"', 'y = "math"', 'z = "inline_math"'],
    );
  });

  it('fixes text within blockquotes and list items correctly', () => {
    const input = [
      '> "Blockquote" with --- an ellipsis...',
      '> ',
      '> And a "second" quote.',
      '',
      '* "List item" 1.',
      '* "List item" 2 with (c) 2025 symbol.',
    ].join('\n');
    const file = run(input);
    const expectedOutput = [
      '> “Blockquote” with—an ellipsis…',
      '>',
      '> And a\u00A0“second” quote.',
      '',
      '* “List item” 1.',
      '* “List item” 2\u00A0with ©\u00A02025 symbol.',
      '',
    ].join('\n');
    assert.equal(String(file), expectedOutput);
  });

  it('fixes text in nested lists but maintains list structure', () => {
    const md = [
      '* "Level 1" --- dash',
      '  * "Level 2" (c) 2025',
      '    * "Level 3"',
    ].join('\n');

    const out = run(md);

    const expected = [
      '* “Level 1” — dash',
      '  * “Level 2” ©\u00A02025',
      '    * “Level 3”',
      '',
    ].join('\n');

    assert.equal(String(out), expected);

    const tree = parse(String(out));
    let deepest = 0;

    visitParents(tree as Root, 'list', (_node, ancestors) => {
      // Count how many ancestors (including the current node) are <list>
      const depthHere =
        ancestors.filter((n): n is List => n.type === 'list').length + 1; // +1 for current node
      deepest = Math.max(deepest, depthHere);
    });

    assert.equal(deepest, 3, 'expected three levels of nesting');
  });

  it('does not alter link URLs but does alter titles', () => {
    const src = '["test"](https://www.google.com/search?q="hello"&hl=en)';
    const out = String(run(src));
    assert.equal(
      out,
      '[“test”](https://www.google.com/search?q="hello"\\&hl=en)' + '\n',
    );
  });

  it('respects locale-specific rules (sk)', () => {
    const sk =
      'Typopo surrounds em-dashes with hairspaces in Slovak—whereas in English it doesn\u2019t.';
    const out = String(run(sk, { locale: 'sk' }));

    assert.ok(out.includes('\u200A'), 'expected hairspaces');
  });
});

describe('remark-typopo (with allow flags)', () => {
  it('honors allowInCodeBlocks', () => {
    const input = ['```js', 'const x = "one";', '```'].join('\n');
    const out = run(input, { allowInCodeBlocks: true });

    const expected = ['```js', 'const x\u00A0= “one”;', '```', ''].join('\n');

    assert.equal(String(out), expected);
  });

  it('honors allowInCodeBlocks with multi-line input', () => {
    const input = [
      '```js',
      'const x = "one";',
      '// A "comment" with "more" quotes.',
      'const y = "two";',
      '```',
    ].join('\n');
    const out = run(input, { allowInCodeBlocks: true });

    const expected = [
      '```js',
      'const x\u00A0= “one”;',
      '//\u00A0A “comment” with “more” quotes.',
      'const y\u00A0= “two”;',
      '```',
      '',
    ].join('\n');

    assert.equal(String(out), expected);
  });

  it('honors allowInInlineCode', () => {
    const src = '`"x" --- y`';
    const out = run(src, { allowInInlineCode: true });
    assert.match(String(out), /`“x” — y`/);
  });
});
