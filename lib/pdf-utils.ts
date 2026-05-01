// Matches Hebrew block (U+0590-U+05FF) and the shekel sign (U+20AA).
const HEBREW_RE = /[\u0590-\u05FF\u20AA]/;

// @react-pdf/renderer v4 has no Unicode BiDi support: all text renders LTR.
// Fully reversing the string produces the correct visual (RTL) representation;
// the reader's right-to-left eye scan reconstructs the original logical order
// for Hebrew words, numbers, Latin runs, and mixed content alike.
function processRtlLine(line: string): string {
  if (!HEBREW_RE.test(line)) return line;
  return Array.from(line).reverse().join('');
}

export function fixPdfHebrewRtl(text: string | number | null | undefined): string {
  if (text == null || text === '') return '';
  const str = String(text);
  if (!HEBREW_RE.test(str)) return str;
  return str.split('\n').map(processRtlLine).join('\n');
}

export const fixPdfHebrew = fixPdfHebrewRtl;
