import { Mock } from 'vitest';

export type MockFn<Fn extends (...args: any[]) => any> = Mock<Fn>;
