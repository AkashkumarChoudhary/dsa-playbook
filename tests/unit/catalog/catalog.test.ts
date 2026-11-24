import { describe, expect, it } from 'vitest';
import { catalogLessons } from '../../../content/catalog/lessons';
import { catalogModules } from '../../../content/catalog/modules';
import { catalogPatterns } from '../../../content/catalog/patterns';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('catalog modules, lessons and patterns', () => {
  it('has the 26 modules of spec §5 in order', () => {
    expect(catalogModules).toHaveLength(26);
    expect(catalogModules.map((m) => m.order)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    expect(unique(catalogModules.map((m) => m.id))).toBe(true);
    for (const m of catalogModules) expect(m.id).toMatch(KEBAB);
    const levels = catalogModules.map((m) => m.level);
    expect(levels.filter((l) => l === 'basics')).toHaveLength(7);
    expect(levels.filter((l) => l === 'core')).toHaveLength(7);
    expect(levels.filter((l) => l === 'hard')).toHaveLength(6);
    expect(levels.filter((l) => l === 'advanced')).toHaveLength(5);
    expect(levels.filter((l) => l === 'interview')).toHaveLength(1);
  });

  it('starts Foundations with the spec §5 draft lessons', () => {
    expect(catalogLessons.filter((l) => l.moduleId === 'foundations').map((l) => l.id)).toEqual([
      'what-is-dsa', 'big-o-time', 'big-o-space', 'reading-limits', 'java-toolkit', 'how-to-dry-run', 'brute-better-optimal', 'edge-cases', 'interview-script',
    ]);
  });

  it('gives every module lessons with kebab ids and sensible minutes', () => {
    expect(catalogLessons).toHaveLength(126);
    expect(unique(catalogLessons.map((l) => l.id))).toBe(true);
    for (const l of catalogLessons) {
      expect(l.id).toMatch(KEBAB);
      expect(catalogModules.some((m) => m.id === l.moduleId), l.id).toBe(true);
      expect(l.minutes, l.id).toBeGreaterThanOrEqual(10);
      expect(l.minutes, l.id).toBeLessThanOrEqual(30);
    }
    for (const m of catalogModules) expect(catalogLessons.some((l) => l.moduleId === m.id), m.id).toBe(true);
  });

  it('links each pattern to exactly one lesson in the same module, and back', () => {
    expect(catalogPatterns).toHaveLength(107);
    expect(unique(catalogPatterns.map((p) => p.id))).toBe(true);
    expect(catalogPatterns.find((p) => p.id === 'hashing')).toMatchObject({ moduleId: 'hashing', lessonId: 'hashset-seen-before' });
    for (const p of catalogPatterns) {
      expect(p.id).toMatch(KEBAB);
      const lesson = catalogLessons.find((l) => l.id === p.lessonId);
      expect(lesson?.patternId, p.id).toBe(p.id);
      expect(lesson?.moduleId, p.id).toBe(p.moduleId);
    }
    for (const l of catalogLessons.filter((x) => x.patternId)) {
      expect(catalogPatterns.filter((p) => p.lessonId === l.id), l.id).toHaveLength(1);
    }
  });
});
