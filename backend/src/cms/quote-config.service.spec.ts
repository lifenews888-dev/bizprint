import { QuoteConfigService } from './quote-config.service';

describe('QuoteConfigService', () => {
  function makeService(existing: any[] = []) {
    const saved: any[] = [];
    const repo = {
      find: jest.fn(async (options?: any) => {
        if (options?.where?.is_active === true) {
          return [...existing, ...saved].filter((config) => config.is_active !== false);
        }
        return [...existing, ...saved];
      }),
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn((data) => ({ is_active: true, ...data })),
      save: jest.fn(async (data) => {
        saved.push(data);
        return data;
      }),
    };

    return { service: new QuoteConfigService(repo as any), repo, saved };
  }

  it('seeds defaults before public findAll when table is empty', async () => {
    const { service, saved } = makeService();

    const result = await service.findAll();

    expect(saved.length).toBeGreaterThan(0);
    expect(result.some((config) => config.product_type === 'banner')).toBe(true);
  });

  it('does not overwrite existing admin configs while seeding missing defaults', async () => {
    const existingBanner = {
      product_type: 'banner',
      name_mn: 'Custom banner',
      is_active: true,
    };
    const { service, repo, saved } = makeService([existingBanner]);

    const result = await service.seed();

    expect(repo.save).not.toHaveBeenCalledWith(expect.objectContaining({
      product_type: 'banner',
    }));
    expect(saved.some((config) => config.product_type === 'flyer')).toBe(true);
    expect(result.seeded).toBeGreaterThan(0);
  });
});
