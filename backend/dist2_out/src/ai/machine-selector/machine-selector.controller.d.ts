import { MachineSelectorService } from './machine-selector.service';
export declare class MachineSelectorController {
    private readonly service;
    constructor(service: MachineSelectorService);
    select(body: any): {
        selected_machine: any;
        machine_type: any;
        estimated_cost: any;
    };
}
