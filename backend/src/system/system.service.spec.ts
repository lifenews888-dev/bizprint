import { SystemService } from './system.service';

describe('SystemService readiness', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-02T07:00:00.000Z'));
    jest.spyOn(process, 'uptime').mockReturnValue(125);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  const makeService = (dataSource: { isInitialized: boolean; query?: jest.Mock }) =>
    new SystemService(dataSource as any, {} as any);

  it('returns public readiness metadata with commit and database status', async () => {
    process.env.RAILWAY_GIT_COMMIT_SHA = 'abcdef1234567890';
    process.env.RAILWAY_DEPLOYMENT_ID = 'deploy_123';
    process.env.NODE_ENV = 'production';
    process.env.npm_package_version = '2.3.4';
    const query = jest.fn(async () => [{ '?column?': 1 }]);
    const service = makeService({ isInitialized: true, query });

    const result = await service.getReadiness();

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(result).toMatchObject({
      status: 'ready',
      service: 'bizprint-backend',
      version: '2.3.4',
      commit: 'abcdef1234567890',
      commit_short: 'abcdef1',
      deployment: 'deploy_123',
      environment: 'production',
      uptime_seconds: 125,
      started_at: '2026-06-02T06:57:55.000Z',
      checks: {
        api: 'up',
        database: 'up',
      },
    });
    expect(result.latencies_ms.database).toEqual(expect.any(Number));
  });

  it('marks readiness not_ready when database ping fails', async () => {
    const query = jest.fn(async () => {
      throw new Error('db unavailable');
    });
    const service = makeService({ isInitialized: true, query });

    const result = await service.getReadiness();

    expect(result.status).toBe('not_ready');
    expect(result.checks.database).toBe('down');
    expect(result.latencies_ms.database).toBeNull();
  });

  it('does not query database when datasource is not initialized', async () => {
    const query = jest.fn();
    const service = makeService({ isInitialized: false, query });

    const result = await service.getReadiness();

    expect(query).not.toHaveBeenCalled();
    expect(result.status).toBe('not_ready');
    expect(result.checks.database).toBe('down');
  });
});
