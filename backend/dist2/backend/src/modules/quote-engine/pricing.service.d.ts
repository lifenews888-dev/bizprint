export declare class PricingService {
    calculate(specs: any, machine: any, quantity: number): {
        materialCost: number;
        machineCost: number;
        laborCost: number;
        total: number;
    };
}
