import { CalculateGangRunDto } from './dto/calculate-gangrun.dto';
export declare class GangrunService {
    calculate(data: CalculateGangRunDto): {
        error: string;
        total_orders?: undefined;
        sheet_capacity?: undefined;
        sheets_needed?: undefined;
        waste_capacity?: undefined;
    } | {
        total_orders: number;
        sheet_capacity: number;
        sheets_needed: number;
        waste_capacity: number;
        error?: undefined;
    };
}
