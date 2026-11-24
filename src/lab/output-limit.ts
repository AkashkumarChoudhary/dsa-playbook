/** Learner output is cut here, so a print in a big loop cannot flood the page. */
export const MAX_OUTPUT_LINES = 1000;
/** Counted in characters, which is the same as bytes for plain text. */
export const MAX_OUTPUT_CHARS = 64 * 1024;
export const OUTPUT_HIDDEN = 'More output was hidden.';

const END = '@@END ';

/**
 * Returns a filter for printed lines. Give it each line. It returns the lines to pass on.
 * Harness lines (they start with @@) always pass. Other lines pass until the line or size
 * limit, then one OUTPUT_HIDDEN line is sent and the rest is dropped.
 */
export function createOutputLimit(maxLines = MAX_OUTPUT_LINES, maxChars = MAX_OUTPUT_CHARS): (line: string) => string[] {
  let lines = 0;
  let chars = 0;
  let full = false;
  const hide = (): string[] => {
    if (full) return [];
    full = true;
    return [OUTPUT_HIDDEN];
  };
  const fits = (text: string): boolean => {
    if (full || lines + 1 > maxLines || chars + text.length > maxChars) return false;
    lines += 1;
    chars += text.length;
    return true;
  };
  return (line) => {
    if (line.startsWith('@@')) return [line];
    // print() without a newline glues the learner's text to the harness end line. Keep the end line.
    const at = line.indexOf(END);
    if (at > 0) {
      const text = line.slice(0, at);
      return fits(text) ? [line] : [...hide(), line.slice(at)];
    }
    return fits(line) ? [line] : hide();
  };
}
