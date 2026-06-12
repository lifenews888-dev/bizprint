import { Test } from '@nestjs/testing';

type MockMap = Record<PropertyKey, unknown>;

function createMethodMock() {
  return new Proxy<MockMap>(
    {},
    {
      get(target, prop) {
        if (prop === 'then') return undefined;
        if (!(prop in target)) {
          target[prop] = jest.fn();
        }
        return target[prop];
      },
    },
  );
}

function createRepositoryMock() {
  return {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
    findOneBy: jest.fn(async () => null),
    count: jest.fn(async () => 0),
    createQueryBuilder: jest.fn(() => createMethodMock()),
    manager: {
      connection: {
        getRepository: jest.fn(() => createRepositoryMock()),
      },
    },
  };
}

const originalCreateTestingModule = Test.createTestingModule.bind(Test);

(Test as any).createTestingModule = (...args: Parameters<typeof Test.createTestingModule>) => {
  const builder = originalCreateTestingModule(...args);
  return builder.useMocker((token) => {
    if (typeof token === 'string' && token.endsWith('Repository')) {
      return createRepositoryMock();
    }
    return createMethodMock();
  });
};
