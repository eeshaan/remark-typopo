# remark-typopo

A [remark](https://github.com/remarkjs/remark) plugin integrating [Typopo](https://github.com/surfinzap/typopo) to automatically fix frequent microtypographical errors in Markdown text.

## What is this?

This package integrates [Typopo](https://github.com/surfinzap/typopo), a [microtypography](https://en.wikipedia.org/wiki/Microtypography) correction library created by [Braňo Šandala](https://brano.me), into [remark](https://github.com/remarkjs/remark), a Markdown processor. Typopo corrects punctuation, whitespace, symbols, and other typographical details, ensuring professional-quality typography. Typopo supports multiple languages including English, German, Slovak, Czech, and Rusyn.

## Why use `remark-typopo` instead of existing solutions?

While plugins like [`remark-smartypants`](https://github.com/silvenon/remark-smartypants) provide basic typographical enhancements, Typopo offers more comprehensive language-specific fixes and robust handling of microtypography errors. For example:

| Input                               | SmartyPants Output                                                    | Typopo Output                       |
| ----------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `Hello -- and goodbye.`             | `Hello — and goodbye.` (spacing not corrected)                       | `Hello—and goodbye.`               |
| `(c) 2025`                          | `(c) 2025` (symbol not converted)                                     | `© 2025`                            |
| `'Twas the night before Christmas.` | `‘Twas the night before Christmas.` (incorrect usage of single-quote) | `’Twas the night before Christmas.` |

## Features

Typopo fixes:

- Dashes and hyphens
- Quotes (single, double, primes)
- Ellipsis
- Symbols (multiplication signs, section signs, copyright symbols, trademarks, etc.)
- Whitespace issues (non-breaking spaces, extra spaces, empty lines)
- Common punctuation errors
- [And much more…](https://github.com/surfinzap/typopo?tab=readme-ov-file#features)

## Installation

> [!NOTE]  
> This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

```console
npm install remark-typopo
```

## Usage

### Typical usage with `remark`

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkTypopo from 'remark-typopo';
import remarkStringify from 'remark-stringify';

const markdown = '"Hello" --- world!';

const processed = await unified()
  .use(remarkParse)
  .use(remarkTypopo, { locale: 'en-us' })
  .use(remarkStringify)
  .process(markdown);

console.log(String(processed));
// => “Hello” — world!
```

### Usage with Astro

In Astro projects, you may want to set `smartypants` to `false` in your `astro.config.mjs` or `astro.config.mts` to avoid potential conflicts.

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import remarkTypopo from 'remark-typopo';

export default defineConfig({
  markdown: {
    smartypants: false,  // Turn off built-in smartypants
    remarkPlugins: [
      [remarkTypopo, { locale: 'en-us' }],
    ],
  },
});
```

## Options

The following options are available:

| Option              | Type    | Default   | Description                                                                             |
| ------------------- | ------- | --------- | --------------------------------------------------------------------------------------- |
| `locale`            | string  | `'en-us'` | Language locale for Typopo corrections (`'en-us'`, `'de-de'`, `'sk'`, `'cs'`, `'rue'`). |
| `allowInCodeBlocks` | boolean | `false`   | Allow Typopo corrections inside fenced code blocks.                                     |
| `allowInInlineCode` | boolean | `false`   | Allow Typopo corrections within inline code spans.                                      |

### Deprecated options (not compatible)

The following original Typopo options are incompatible with this remark integration and are thus deprecated:

- `removeLines`
- `removeWhitespacesBeforeMarkdownList`
- `keepMarkdownCodeBlocks`

Attempting to use these will have no effect or produce unintended side effects.

## License

[MIT](https://github.com/eeshaan/remark-typopo/blob/main/LICENSE)
