import { PrintSizeService } from './print-size.service';
export declare class PrintSizeController {
    private readonly service;
    constructor(service: PrintSizeService);
    detect(body: any): {
        detected_size: string;
        width_mm: number;
        height_mm: number;
    };
}
