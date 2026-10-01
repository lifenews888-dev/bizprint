import { shouldSynchronizeSchema } from './db-sync';

/**
 * synchronize нь production дээр схемийг анхааруулгагүй өөрчилдөг тул
 * унтраалгын логик буруу бол өгөгдөл алдагдах эрсдэлтэй.
 */
describe('shouldSynchronizeSchema', () => {
  const original = { ...process.env };

  afterEach(() => { process.env = { ...original }; });

  const setEnv = (nodeEnv?: string, flag?: string) => {
    delete process.env.NODE_ENV;
    delete process.env.DB_SYNCHRONIZE;
    if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;
    if (flag !== undefined) process.env.DB_SYNCHRONIZE = flag;
  };

  it('is off when DB_SYNCHRONIZE=false, whatever NODE_ENV says', () => {
    setEnv('development', 'false');
    expect(shouldSynchronizeSchema()).toBe(false);

    setEnv(undefined, 'false');
    expect(shouldSynchronizeSchema()).toBe(false);
  });

  it('is on when DB_SYNCHRONIZE=true, even in production', () => {
    setEnv('production', 'true');
    expect(shouldSynchronizeSchema()).toBe(true);
  });

  it('falls back to NODE_ENV when the flag is unset', () => {
    setEnv('production');
    expect(shouldSynchronizeSchema()).toBe(false);

    setEnv('development');
    expect(shouldSynchronizeSchema()).toBe(true);

    // Railway дээр NODE_ENV тохируулаагүй — өмнөх зан үйл хэвээр үлдэнэ
    setEnv();
    expect(shouldSynchronizeSchema()).toBe(true);
  });

  it('ignores values that are not exactly true or false', () => {
    setEnv('production', 'yes');
    expect(shouldSynchronizeSchema()).toBe(false);

    setEnv('development', '1');
    expect(shouldSynchronizeSchema()).toBe(true);
  });
});
