import { CommissionController } from './commission.controller';

describe('CommissionController', () => {
  const service = {
    findAll: jest.fn(),
    getSummary: jest.fn(),
    autoApproveDelayedCommissions: jest.fn(),
    autoApproveDelayedSalesCommissions: jest.fn(),
    autoApproveDelayedDesignerRoyalties: jest.fn(),
  };

  let controller: CommissionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CommissionController(service as any);
  });

  it('scopes vendor commission list to the logged-in non-admin user', () => {
    controller.findAll({ user: { id: 'vendor-user-1', role: 'vendor' } }, 'other-vendor', 'pending');

    expect(service.findAll).toHaveBeenCalledWith({
      vendorId: 'vendor-user-1',
      status: 'pending',
    });
  });

  it('scopes vendor commission summary to the logged-in non-admin user', () => {
    controller.getSummary({ user: { id: 'vendor-user-1', role: 'vendor' } }, 'other-vendor');

    expect(service.getSummary).toHaveBeenCalledWith('vendor-user-1');
  });

  it('allows admins to query any vendor commission summary', () => {
    controller.getSummary({ user: { id: 'admin-1', role: 'admin' } }, 'vendor-user-2');

    expect(service.getSummary).toHaveBeenCalledWith('vendor-user-2');
  });
});
