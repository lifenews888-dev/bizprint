import { CommissionService } from './commission.service';
import { CommissionStatus } from './commission.entity';

describe('CommissionService', () => {
  function makeService(existingLog: any = null) {
    const repo = {
      findOne: jest.fn(async () => existingLog),
      create: jest.fn((dto: any) => dto),
      save: jest.fn(async (dto: any) => ({ ...dto, id: 'commission-1' })),
    };
    const vendorRepo = {
      findOne: jest.fn(async () => ({
        id: 'vendor-1',
        user_id: 'vendor-user-1',
        company_name: 'Good Print',
        commission_rate: 12,
      })),
    };
    const service = new CommissionService(
      repo as any,
      {} as any,
      {} as any,
      vendorRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { credit: jest.fn() } as any,
      { on: jest.fn(), emit: jest.fn() } as any,
      { create: jest.fn() } as any,
      undefined,
    );

    return { service, repo, vendorRepo };
  }

  it('returns existing inquiry commission for the same vendor instead of creating a duplicate', async () => {
    const existingLog = {
      id: 'existing-1',
      inquiry_id: 'inq-1',
      vendor_id: 'vendor-user-1',
      gross_amount: 120000,
    };
    const { service, repo } = makeService(existingLog);

    const result = await service.create({
      inquiryId: 'inq-1',
      vendorId: 'vendor-user-1',
      grossAmount: 120000,
    });

    expect(result).toBe(existingLog);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { inquiry_id: 'inq-1', vendor_id: 'vendor-user-1' },
    });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates a pending commission when no matching inquiry commission exists', async () => {
    const { service, repo, vendorRepo } = makeService(null);

    const result = await service.create({
      inquiryId: 'inq-1',
      vendorId: 'vendor-user-1',
      grossAmount: 120000,
    });

    expect(vendorRepo.findOne).toHaveBeenCalledWith({ where: { user_id: 'vendor-user-1' } });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      vendor_id: 'vendor-user-1',
      vendor_name: 'Good Print',
      gross_amount: 120000,
      commission_rate: 12,
      commission_amount: 14400,
      net_amount: 105600,
      status: CommissionStatus.PENDING,
    }));
    expect(result).toMatchObject({ id: 'commission-1' });
  });

  it('returns existing inquiry commission after a database duplicate-key race', async () => {
    const existingLog = {
      id: 'existing-after-race',
      inquiry_id: 'inq-1',
      vendor_id: 'vendor-user-1',
      gross_amount: 120000,
    };
    const { service, repo } = makeService(null);
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingLog);
    repo.save.mockRejectedValueOnce({ code: '23505' });

    const result = await service.create({
      inquiryId: 'inq-1',
      vendorId: 'vendor-user-1',
      grossAmount: 120000,
    });

    expect(result).toBe(existingLog);
    expect(repo.findOne).toHaveBeenLastCalledWith({
      where: { inquiry_id: 'inq-1', vendor_id: 'vendor-user-1' },
    });
  });
});
