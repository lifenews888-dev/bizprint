export declare class MachineSelectorService {
    machines: {
        name: string;
        type: string;
        max_sheet: number[];
        speed_per_hour: number;
        setup_cost: number;
        run_cost: number;
    }[];
    select(job: any): {
        selected_machine: any;
        machine_type: any;
        estimated_cost: any;
    };
}
