import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalog } from '../../../content/catalog';
import { catalogModules } from '../../../content/catalog/modules';
import { catalogPatterns } from '../../../content/catalog/patterns';
import { catalogProblems } from '../../../content/catalog/problems';
import { neetcode150 } from '../../../content/sheets/neetcode150';
import { striverBs } from '../../../content/sheets/striver-bs';
import { striverRecursion } from '../../../content/sheets/striver-recursion';
// @ts-expect-error The generator is plain JavaScript with no type file.
import { renderFiles } from '../../../scripts/build-catalog.mjs';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('problem catalog (generated from docs/curriculum/problem-map.md)', () => {
  it('has every problem of the map once', () => {
    expect(catalogProblems).toHaveLength(319);
    expect(unique(catalogProblems.map((p) => p.id))).toBe(true);
    for (const p of catalogProblems) expect(p.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('matches the summary table of the map', () => {
    expect(catalogProblems.filter((p) => p.sheets.includes('neetcode150'))).toHaveLength(150);
    expect(catalogProblems.filter((p) => p.sheets.includes('striver-bs'))).toHaveLength(32);
    expect(catalogProblems.filter((p) => p.sheets.includes('striver-recursion'))).toHaveLength(22);
    expect(catalogProblems.filter((p) => p.sheets.length === 0)).toHaveLength(129);
    const perModule = (id: string) => catalogProblems.filter((p) => p.moduleId === id).length;
    expect(perModule('foundations')).toBe(1);
    expect(perModule('binary-search')).toBe(34);
    expect(perModule('trees')).toBe(27);
    expect(perModule('interview-meta')).toBe(0);
  });

  it('keeps the sheets in their own order and in step with each problem', () => {
    expect(neetcode150).toHaveLength(150);
    expect(neetcode150.slice(0, 3)).toEqual(['contains-duplicate', 'valid-anagram', 'two-sum']);
    expect(neetcode150.at(-1)).toBe('reverse-integer');
    expect(striverBs).toHaveLength(32);
    expect(striverBs[0]).toBe('binary-search');
    expect(striverBs.at(-1)).toBe('median-in-a-row-wise-sorted-matrix');
    expect(striverRecursion).toHaveLength(22);
    expect(striverRecursion[0]).toBe('1-to-n-without-loop');
    expect(striverRecursion.at(-1)).toBe('rat-in-maze');
    for (const sheet of catalog.sheets) {
      expect(unique(sheet.problemIds), sheet.id).toBe(true);
      const tagged = catalogProblems.filter((p) => p.sheets.includes(sheet.id)).map((p) => p.id);
      expect([...sheet.problemIds].sort(), sheet.id).toEqual(tagged.sort());
    }
  });

  it('maps every problem to 1 or 2 known patterns, and every pattern has 1 to 3 core problems', () => {
    const patternIds = new Set(catalogPatterns.map((p) => p.id));
    const moduleIds = new Set(catalogModules.map((m) => m.id));
    for (const p of catalogProblems) {
      expect(moduleIds.has(p.moduleId), p.id).toBe(true);
      expect(p.patternIds.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.patternIds.length, p.id).toBeLessThanOrEqual(2);
      for (const id of p.patternIds) expect(patternIds.has(id), `${p.id} → ${id}`).toBe(true);
    }
    for (const pattern of catalogPatterns) {
      const core = catalogProblems.filter((p) => p.core && p.patternIds.includes(pattern.id));
      expect(core.length, pattern.id).toBeGreaterThanOrEqual(1);
      expect(core.length, pattern.id).toBeLessThanOrEqual(3);
    }
  });

  it('keeps the model problem as built', () => {
    expect(catalogProblems.find((p) => p.id === 'contains-duplicate')).toEqual({
      id: 'contains-duplicate', title: 'Contains Duplicate', moduleId: 'foundations', difficulty: 'easy', patternIds: ['hashing'],
      sheets: ['neetcode150'], url: 'https://leetcode.com/problems/contains-duplicate/', lc: 217, core: true,
    });
  });

  it('is up to date with the problem map', () => {
    const files = renderFiles(readFileSync('docs/curriculum/problem-map.md', 'utf8')) as Record<string, string>;
    for (const [path, body] of Object.entries(files)) expect(readFileSync(path, 'utf8'), path).toBe(body);
  });
});
