/* global hexo */

'use strict';

const DISPLAY_DELIMITERS = [
  { open: /^ {0,3}\$\$[ \t]*$/, close: /^ {0,3}\$\$[ \t]*$/ },
  { open: /^ {0,3}\\\[[ \t]*$/, close: /^ {0,3}\\\][ \t]*$/ }
];

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;

function renderInlineMath(line) {
  const codeSpans = [];
  const protectedLine = line.replace(/(`+)([^`]*?)\1/g, match => {
    const token = `\u0000OYSTER_CODE_${codeSpans.length}\u0000`;
    codeSpans.push(match);
    return token;
  });

  const rendered = protectedLine
    .replace(/\\\((.+?)\\\)/g, (_, expression) => {
      return `{% katex %}${expression.trim()}{% endkatex %}`;
    })
    .replace(/(^|[^\\$])\$(?![\s$])([^$\n]*?[^\\$\s])\$(?![\d$])/g, (_, prefix, expression) => {
      return `${prefix}{% katex %}${expression.trim()}{% endkatex %}`;
    });

  return rendered.replace(/\u0000OYSTER_CODE_(\d+)\u0000/g, (_, index) => codeSpans[Number(index)]);
}

function convertMathDelimiters(markdown) {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let fence = null;
  let math = null;

  lines.forEach(line => {
    if (fence) {
      output.push(line);
      const close = new RegExp(`^ {0,3}${fence.character}{${fence.length},}[ \\t]*$`);
      if (close.test(line)) fence = null;
      return;
    }

    const fenceMatch = line.match(FENCE_OPEN);
    if (fenceMatch && !math) {
      fence = {
        character: fenceMatch[1][0],
        length: fenceMatch[1].length
      };
      output.push(line);
      return;
    }

    if (math) {
      if (math.delimiter.close.test(line)) {
        output.push('{% katex \'{"displayMode":true}\' %}');
        output.push(math.lines.join('\n').trim());
        output.push('{% endkatex %}');
        math = null;
      } else {
        math.lines.push(line);
      }
      return;
    }

    const delimiter = DISPLAY_DELIMITERS.find(item => item.open.test(line));
    if (delimiter) {
      math = { delimiter, openingLine: line, lines: [] };
      return;
    }

    output.push(renderInlineMath(line));
  });

  if (math) {
    output.push(math.openingLine, ...math.lines);
  }

  return output.join('\n');
}

hexo.extend.filter.register('before_post_render', data => {
  if (!data || typeof data.content !== 'string' || !data.katex) return data;

  data.content = convertMathDelimiters(data.content);
  return data;
});
