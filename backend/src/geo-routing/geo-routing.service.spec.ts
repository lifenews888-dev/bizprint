import { GeoRoutingService } from './geo-routing.service';

describe('GeoRoutingService', () => {
  const makeService = (vendors: any[]) => {
    const repo = {
      find: jest.fn(async () => vendors),
    };

    return {
      service: new GeoRoutingService(repo as any),
      repo,
    };
  };

  it('keeps active vendors visible even when vendor location is missing', async () => {
    const { service } = makeService([
      {
        id: 'located',
        company_name: 'Located Print',
        status: 'active',
        latitude: 47.9138,
        longitude: 106.9057,
        services: ['banner'],
        score: 80,
        load_status: 'available',
      },
      {
        id: 'unlocated',
        company_name: 'Unlocated Print',
        status: 'active',
        latitude: null,
        longitude: null,
        services: ['banner'],
        score: 95,
        load_status: 'available',
      },
    ]);

    const result = await service.findNearestVendors(
      { lat: 47.9138, lng: 106.9057 },
      { productType: 'banner', limit: 10 },
    );

    expect(result.candidates.map(v => v.vendor.id)).toContain('located');
    expect(result.candidates.map(v => v.vendor.id)).toContain('unlocated');
    expect(result.candidates.find(v => v.vendor.id === 'unlocated')).toMatchObject({
      hasLocation: false,
      distanceKm: 9999,
    });
  });

  it('does not apply a hard-coded distance cap when maxDistanceKm is omitted', async () => {
    const { service } = makeService([
      {
        id: 'far',
        company_name: 'Far Province Print',
        status: 'active',
        latitude: 46.2634,
        longitude: 100.7394,
        services: ['banner'],
        score: 70,
        load_status: 'available',
      },
    ]);

    const allResult = await service.findNearestVendors(
      { lat: 47.9138, lng: 106.9057 },
      { productType: 'banner', limit: 10 },
    );
    const cappedResult = await service.findNearestVendors(
      { lat: 47.9138, lng: 106.9057 },
      { productType: 'banner', maxDistanceKm: 50, limit: 10 },
    );

    expect(allResult.candidates.map(v => v.vendor.id)).toContain('far');
    expect(cappedResult.candidates.map(v => v.vendor.id)).not.toContain('far');
  });

  it('uses the default customer location when request location is invalid', async () => {
    const { service } = makeService([
      {
        id: 'default-near',
        company_name: 'Default Near Print',
        status: 'active',
        latitude: 47.9138,
        longitude: 106.9057,
        services: [],
        score: 80,
        load_status: 'available',
      },
    ]);

    const result = await service.findNearestVendors(
      { lat: Number.NaN, lng: Number.POSITIVE_INFINITY },
      { limit: 10 },
    );

    expect(result.customerLocation).toEqual({ lat: 47.9138, lng: 106.9057 });
    expect(result.nearest?.vendor.id).toBe('default-near');
  });
});
