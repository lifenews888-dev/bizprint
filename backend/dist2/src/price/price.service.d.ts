import { Repository } from 'typeorm';
import { PaperType } from './paper-type.entity';
import { PrintSize } from './print-size.entity';
import { FinishType } from './finish-type.entity';
import { Machine } from '../machines/machine.entity';
export declare class PriceService {
    private paperRepo;
    private sizeRepo;
    private finishRepo;
    private machineRepo;
    constructor(paperRepo: Repository<PaperType>, sizeRepo: Repository<PrintSize>, finishRepo: Repository<FinishType>, machineRepo: Repository<Machine>);
    printQuote(data: any): Promise<{
        machine: string;
        sheet_capacity: number;
        sheets_needed: number;
        paper_cost: number;
        machine_cost: number;
        production_cost: number;
        unit_price: number;
        total_price: number;
        waste_percent: number;
    }>;
    gangQuote(data: any): Promise<{
        machine: string;
        sheet_capacity: number;
        sheets_needed: number;
        total_quantity: any;
        production_cost: number;
        total_price: number;
        orders: any;
    }>;
}
