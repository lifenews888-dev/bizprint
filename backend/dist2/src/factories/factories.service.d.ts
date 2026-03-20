interface Factory {
    id: number;
    name: string;
    machine_type: string;
    speed_per_hour: number;
    setup_cost: number;
    run_cost: number;
    current_load: number;
}
export declare class FactoriesService {
    factories: Factory[];
    findAll(): Factory[];
    selectBestFactory(machineType: string, quantity: number): Factory;
}
export {};
