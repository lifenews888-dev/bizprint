import { SheetOptimizerService } from './sheet-optimizer.service';

describe('SheetOptimizerService', () => {
  let service: SheetOptimizerService;

  beforeEach(() => {
    service = new SheetOptimizerService();
  });

  it('calculates a deterministic sheet layout for a candidate sheet', () => {
    const result = service.optimizeItem(
      {
        width_mm: 30,
        height_mm: 20,
        quantity: 9,
        bleed_mm: 0,
        gutter_mm: 0,
      },
      {
        allow_landscape: false,
        candidate_sheets: [
          { name: 'TestSheet', width_mm: 100, height_mm: 60, gripper_mm: 0, tail_mm: 0 },
        ],
      },
    );

    expect(result).toEqual(expect.objectContaining({
      sheet: expect.objectContaining({ name: 'TestSheet' }),
      orientation: 'portrait',
      columns: 3,
      rows: 3,
      items_per_sheet: 9,
      sheet_count: 1,
      utilization_pct: 90,
    }));
  });
});
