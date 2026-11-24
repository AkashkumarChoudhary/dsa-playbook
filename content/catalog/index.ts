import type { Catalog } from '../../src/content-types';
import { sheets } from '../sheets';
import { catalogLessons } from './lessons';
import { catalogModules } from './modules';
import { catalogPatterns } from './patterns';
import { catalogProblems } from './problems';

/** Everything the course plans to teach, built or not. The dashboard counts against this. */
export const catalog: Catalog = {
  modules: catalogModules,
  lessons: catalogLessons,
  patterns: catalogPatterns,
  problems: catalogProblems,
  sheets,
};
