# Third-party notices

DSA Playbook uses the software below.

## TeaVM and teavm-javac (Java compiler in the browser)

- Files: `public/runner/teavm/*`. See `VERSION.json` for the source URL, the date and the SHA-256 hashes.
- TeaVM: Copyright konsoletyper and contributors. Licensed under the Apache License, Version 2.0. Source: https://github.com/konsoletyper/teavm
- teavm-javac: Copyright konsoletyper. The source files carry the Apache License 2.0 header. Source: https://github.com/konsoletyper/teavm-javac
- The teavm-javac repo has no LICENSE file at its root yet. We rely on the Apache 2.0 headers in its source files. See the open issue: https://github.com/konsoletyper/teavm-javac/issues/22
- The compiler contains the Java compiler (javac) and the class library from OpenJDK. They are licensed under the GNU General Public License, version 2, with the Classpath Exception. Source: https://github.com/openjdk/jdk
- Full licence texts:
  - Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0.txt
  - GNU General Public License, version 2: https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt
  - The Classpath Exception: https://openjdk.org/legal/gplv2+ce.html

## CodeMirror and Lezer

- Packages: `codemirror`, `@codemirror/*` (autocomplete, commands, lang-java, language, lint, search, state, view), `@lezer/*` (common, highlight, java, lr), and the small helpers they ship with: `@marijn/find-cluster-break`, `crelt`, `style-mod` and `w3c-keyname`. Source: https://github.com/codemirror and https://github.com/lezer-parser
- All of them use the MIT License below, with these copyright lines from their `LICENSE` files:

```
Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin> and others
  (codemirror, @codemirror/*)
Copyright (C) 2018 by Marijn Haverbeke <marijn@haverbeke.berlin> and others
  (@lezer/common, @lezer/highlight, @lezer/lr, style-mod)
Copyright (C) 2020 by Marijn Haverbeke <marijn@haverbeke.berlin> and others
  (@lezer/java)
Copyright (C) 2020 by Marijn Haverbeke <marijn@haverbeke.berlin>
  (crelt)
Copyright (C) 2016 by Marijn Haverbeke <marijn@haverbeke.berlin> and others
  (w3c-keyname)
Copyright (C) 2024 by Marijn Haverbeke <marijn@haverbeke.berlin>
  (@marijn/find-cluster-break)

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Problem lists

- The problems follow the NeetCode 150 list (neetcode.io) and Striver's A2Z sheet (takeuforward.org).
- All explanations on this site are written for this site.
- Each problem is retold in our own words and links to the original.
