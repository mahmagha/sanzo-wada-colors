declare module 'node:test' {
  export interface TestContext {
    name: string;
  }
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: (t: TestContext) => void | Promise<void>): void;
}

declare module 'node:assert/strict' {
  const assert: {
    ok(value: unknown, message?: string): asserts value;
    equal<T>(actual: unknown, expected: T, message?: string): asserts actual is T;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(value: string, regexp: RegExp, message?: string): void;
  };
  export default assert;
}
