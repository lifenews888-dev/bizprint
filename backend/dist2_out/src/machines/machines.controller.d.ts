import { MachinesService } from './machines.service';
import { MachineStatus } from './machine.entity';
export declare class MachinesController {
    private readonly machinesService;
    constructor(machinesService: MachinesService);
    createMachine(body: any): Promise<import("./machine.entity").Machine[]>;
    getMachines(): Promise<import("./machine.entity").Machine[]>;
    getMachine(id: string): Promise<import("./machine.entity").Machine>;
    updateStatus(id: string, body: {
        status: MachineStatus;
    }): Promise<import("./machine.entity").Machine>;
    deleteMachine(id: string): Promise<{
        message: string;
    }>;
}
