const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

export function stripHtml(s: string): string {
  return s
    .replace(/<pre[\s\S]*?<\/pre>/gi, '\n')
    .replace(/<code[\s\S]*?<\/code>/gi, '')
    .replace(/<\/(p|li|h[1-6]|div|tr|td|th)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name: string) => ENTITIES[name] ?? m)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n');
}

export function countWords(s: string): number {
  return stripHtml(s).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function sentences(s: string): string[] {
  return stripHtml(s)
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((x) => x.trim())
    .filter((x) => x !== '');
}
