import type { ProblemSpec } from '../content-types';
import { argExpression, LiteralError } from './java-literals';

export interface HarnessTest {
  id: string;
  args: unknown[];
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const HELPERS = String.raw`final class HarnessJson {
    private HarnessJson() {}

    static String str(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"') b.append("\\\"");
            else if (c == '\\') b.append("\\\\");
            else if (c == '\n') b.append("\\n");
            else if (c == '\r') b.append("\\r");
            else if (c == '\t') b.append("\\t");
            else if (c < 0x20) {
                String h = Integer.toHexString(c);
                b.append("\\u");
                for (int k = h.length(); k < 4; k++) b.append('0');
                b.append(h);
            } else b.append(c);
        }
        return b.append('"').toString();
    }

    static String num(double d) {
        if (Double.isNaN(d) || Double.isInfinite(d)) return str(String.valueOf(d));
        return String.valueOf(d);
    }

    static String of(Object o) {
        if (o == null) return "null";
        if (o instanceof String) return str((String) o);
        if (o instanceof Character) return str(String.valueOf(o));
        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Short || o instanceof Byte) return String.valueOf(o);
        if (o instanceof Double || o instanceof Float) return num(((Number) o).doubleValue());
        StringBuilder b = new StringBuilder("[");
        if (o instanceof int[]) { int[] a = (int[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof long[]) { long[] a = (long[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof double[]) { double[] a = (double[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(num(a[i])); } return b.append(']').toString(); }
        if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof char[]) { char[] a = (char[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(str(String.valueOf(a[i]))); } return b.append(']').toString(); }
        if (o instanceof Object[]) { Object[] a = (Object[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(of(a[i])); } return b.append(']').toString(); }
        if (o instanceof Iterable) { boolean first = true; for (Object x : (Iterable<?>) o) { if (!first) b.append(','); b.append(of(x)); first = false; } return b.append(']').toString(); }
        return str(String.valueOf(o));
    }
}

final class HarnessGen {
    private HarnessGen() {}

    static int[] intRange(int n) {
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = i;
        return a;
    }

    static int[] intConst(int n, int value) {
        int[] a = new int[n];
        Arrays.fill(a, value);
        return a;
    }
}
`;

function testMethod(spec: ProblemSpec, t: HarnessTest, i: number): string {
  if (!ID.test(t.id)) throw new LiteralError(`Test id "${t.id}" must be lowercase letters, digits and dashes`);
  if (t.args.length !== spec.params.length) {
    throw new LiteralError(`Test ${t.id}: expected ${spec.params.length} argument(s), got ${t.args.length}`);
  }
  const decls = spec.params
    .map((p, k) => `            ${p.type} a${k} = ${argExpression(t.args[k], p.type)};`)
    .join('\n');
  const call = spec.params.map((_, k) => `a${k}`).join(', ');
  return `    static void t${i}() {
        System.out.println("@@BEGIN ${t.id}");
        long start = 0L;
        try {
${decls}
            start = System.nanoTime();
            Object result = new Solution().${spec.method}(${call});
            long ms = (System.nanoTime() - start) / 1000000L;
            System.out.println("@@END {\\"id\\":\\"${t.id}\\",\\"ok\\":true,\\"ms\\":" + ms + ",\\"actual\\":" + HarnessJson.of(result) + "}");
        } catch (Throwable e) {
            long ms = start == 0L ? 0L : (System.nanoTime() - start) / 1000000L;
            String message = e.getClass().getName() + (e.getMessage() == null ? "" : ": " + e.getMessage());
            System.out.println("@@END {\\"id\\":\\"${t.id}\\",\\"ok\\":false,\\"ms\\":" + ms + ",\\"error\\":" + HarnessJson.str(message) + "}");
        }
    }`;
}

export function generateHarness(spec: ProblemSpec, tests: HarnessTest[]): string {
  const methods = tests.map((t, i) => testMethod(spec, t, i)).join('\n\n');
  const calls = tests.map((_, i) => `        t${i}();`).join('\n');
  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
${calls}
    }

${methods}
}

${HELPERS}`;
}
