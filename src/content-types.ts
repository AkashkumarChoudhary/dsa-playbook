import type { TraceDef } from './engine/trace';

export type { TraceDef };

export type Level = 'basics' | 'core' | 'hard' | 'advanced' | 'interview';
export type Tier = 'confirmed' | 'educational';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ClueKind = 'size' | 'words' | 'shape' | 'bottleneck';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ScenarioQuestion {
  type: 'scenario';
  q: string;
  answer: string;
}

export interface GlossaryTerm {
  term: string;
  aka: string[];
  def: string;
}

export interface Module {
  id: string;
  order: number;
  level: Level;
  icon: string;
  title: string;
  summary: string;
  /** 'building' relaxes module-level minimums in the content check */
  status: 'building' | 'complete';
  outcomes: string[];
  lessonIds: string[];
  problemIds: string[];
  quiz: (QuizQuestion | ScenarioQuestion)[];
  cheatsheet: { h: string; items: string[] }[];
  glossary: GlossaryTerm[];
}

export interface PictureStep {
  icon: string;
  title: string;
  text: string;
}

export interface SpotClues {
  size: string;
  words: string;
  shape: string;
  bottleneck: string;
}

export interface Trap {
  looksLike: string;
  butIs: string;
  why: string;
}

export interface RealLife {
  text: string;
  tier: Tier;
  /** required when tier is 'confirmed'; a plain source name, no URL */
  source?: string;
}

export interface ComplexityFact {
  q: string;
  a: string;
  why: string;
}

export interface VizRef {
  label: string;
  traceId: string;
  input: unknown;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  summary: string;
  /** trusted HTML */
  example: string;
  /** trusted HTML */
  everyday: string;
  steps: PictureStep[];
  viz: VizRef[];
  /** trusted HTML for "Go deeper" */
  deep: string;
  spot: SpotClues;
  traps: Trap[];
  template: { title: string; java: string };
  complexityFacts: ComplexityFact[];
  realLife: RealLife[];
  mistakes: string[];
  interview: string[];
  quiz: QuizQuestion[];
  problemIds: string[];
}

export type JavaType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'char'
  | 'String'
  | 'int[]'
  | 'int[][]'
  | 'char[][]'
  | 'String[]'
  | 'List<Integer>'
  | 'List<String>'
  | 'List<List<Integer>>'
  | 'List<List<String>>';

export type CompareMode = 'exact' | 'unorderedList' | 'unorderedNested' | 'float';

export type ArgGenerator = { gen: 'intRange'; n: number } | { gen: 'intConst'; n: number; value: number };

export interface Param {
  name: string;
  type: JavaType;
}

export interface TestCase {
  id: string;
  args: unknown[];
  expected: unknown;
}

export interface SpeedTest extends TestCase {
  timeLimitMs: number;
}

export interface ProblemSpec {
  className: 'Solution';
  method: string;
  params: Param[];
  returns: JavaType;
  compare: CompareMode;
  samples: TestCase[];
  hidden: TestCase[];
  speed?: SpeedTest;
}

export interface Approach {
  level: 'brute' | 'better' | 'optimal';
  title: string;
  idea: string;
  /** raw Java source with optional // @L:name markers */
  java: string;
  time: string;
  space: string;
  /** what repeated work the next approach removes; required on all but the last */
  nextStepRemoves?: string;
  traceId?: string;
}

export interface SpotFirst {
  prompt: string;
  options: string[];
  answer: number;
  clues: { kind: ClueKind; text: string }[];
}

export interface ProblemLink {
  title: string;
  why: string;
  /** set when the problem exists on this site */
  id?: string;
}

export interface Problem {
  id: string;
  moduleId: string;
  title: string;
  patternIds: string[];
  difficulty: Difficulty;
  core: boolean;
  sheets: string[];
  source: { name: string; url: string };
  /** trusted HTML */
  statement: string;
  limits: string[];
  examples: { input: string; output: string; note?: string }[];
  spot: SpotFirst;
  hints: [string, string, string];
  approaches: Approach[];
  edgeCases: string[];
  mistakes: string[];
  explain30: string;
  hook: string;
  related: ProblemLink[];
  lookAlikes: ProblemLink[];
  spec: ProblemSpec;
  starter: string;
}
