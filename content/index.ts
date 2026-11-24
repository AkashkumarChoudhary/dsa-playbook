import type { ContentInput } from '../src/core/registry';
import { catalog } from './catalog';
import { bruteBetterOptimal } from './modules/01-foundations/lessons/brute-better-optimal';
import { foundations } from './modules/01-foundations/module';
import { containsDuplicate } from './modules/01-foundations/problems/contains-duplicate/problem';
import { containsDuplicateBrute, containsDuplicateOptimal } from './modules/01-foundations/problems/contains-duplicate/trace';

export const contentInput: ContentInput = {
  modules: [foundations],
  lessons: [bruteBetterOptimal],
  problems: [containsDuplicate],
  traces: [containsDuplicateBrute, containsDuplicateOptimal],
  catalog,
};
