import typopo from 'typopo';
const { fixTypos } = typopo;

import { visit } from 'unist-util-visit';

import type { Code, InlineCode, Parent, Root, Text } from 'mdast';
import type { InlineMath, Math as MdastMath } from 'mdast-util-math';
import type { Locale as TypopoLocale } from 'typopo';
import type { Plugin } from 'unified';

export interface RemarkTypopoOptions {
  /**
   * The locale (language) to use for microtypographic corrections
   * (e.g., 'en-us', 'de-de', 'sk', 'cs', 'rue').
   * @see {@link https://github.com/surfinzap/typopo?tab=readme-ov-file#api | Typopo documentation} for supported locales.
   * @defaultValue 'en-us'
   */
  locale?: TypopoLocale;

  /**
   * @deprecated This option has no effect in `remark-typopo` and cannot be used.
   */
  removeLines?: never;

  /**
   * @deprecated This option has no effect in `remark-typopo` and cannot be used.
   */
  removeWhitespacesBeforeMarkdownList?: never;

  /**
   * @deprecated This option has no effect in `remark-typopo` and cannot be used.
   */
  keepMarkdownCodeBlocks?: never;

  /**
   * Allow Typopo inside code blocks (i.e. ```code```)
   * @defaultValue false
   */
  allowInCodeBlocks?: boolean;

  /**
   * Allow Typopo inside inline code (i.e. `code`)
   * @defaultValue false
   */
  allowInInlineCode?: boolean;
}

const DEFAULT_SETTINGS: RemarkTypopoOptions = {
  locale: 'en-us' as TypopoLocale,
  allowInCodeBlocks: false,
  allowInInlineCode: false,
};

type VerbatimNode = InlineCode | Code | MdastMath | InlineMath;
function isVerbatimNode(node: unknown): node is VerbatimNode {
  if (!node || typeof node !== 'object') return false;

  const type = (node as { type?: string }).type;
  return (
    type === 'code' ||
    type === 'inlineCode' ||
    type === 'math' ||
    type === 'inlineMath'
  );
}

/**
 * A remark plugin to apply microtypography fixes using {@link https://github.com/surfinzap/typopo Typopo}.
 *
 * @param options
 *   Optional `remark-typopo`-specific options to allow Typopo in certain verbatim nodes.
 *
 * @see {@link https://github.com/eeshaan/remark-typopo} for the plugin’s source code and more information.
 * @see {@link https://typopo.org} for more information about Typopo.
 */
const remarkTypopo: Plugin<[RemarkTypopoOptions?], Root> = (options = {}) => {
  const settings = { ...DEFAULT_SETTINGS, ...options };

  const skip = (type: Parent['type'] | VerbatimNode['type']): boolean =>
    (type === 'code' && !settings.allowInCodeBlocks) ||
    (type === 'inlineCode' && !settings.allowInInlineCode) ||
    type === 'math' ||
    type === 'inlineMath';

  return (tree): void => {
    visit(tree, 'text', (node: Text, _i, parent) => {
      if (!node.value?.trim() || (parent && skip(parent.type))) return;
      node.value = applyTypopo(node.value, settings.locale);
    });

    visit(tree, isVerbatimNode, (node: VerbatimNode) => {
      if (skip(node.type)) return;
      node.value = applyTypopo(node.value, settings.locale);
    });
  };
};

const applyTypopo = (
  text: string,
  locale: TypopoLocale | undefined,
): string => {
  // Preserve whitespace at start and end of text
  const [
    ,
    // Skip full match (index 0)
    leading = '',
    content = '',
    trailing = '',
  ] = text.match(/^(\s*)(.*?)(\s*)$/s) ?? [];

  // Only apply fixes to non-whitespace content
  return leading + fixTypos(content, locale, {}) + trailing;
};

export default remarkTypopo;
