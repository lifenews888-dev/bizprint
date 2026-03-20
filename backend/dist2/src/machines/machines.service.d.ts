import { Repository } from 'typeorm';
import { Machine, MachineStatus } from './machine.entity';
export declare class MachinesService {
    private machineRepo;
    constructor(machineRepo: Repository<Machine>);
    createMachine(data: any): Promise<Machine[]>;
    getAllMachines(): Promise<Machine[]>;
    getMachine(id: number): Promise<Machine>;
    updateStatus(id: number, status: MachineStatus): Promise<Machine>;
    deleteMachine(id: number): Promise<{
        message: string;
    }>;
}
