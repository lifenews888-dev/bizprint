import { PdfInspectorService } from './pdf-inspector.service';
export declare class PdfInspectorController {
    private readonly service;
    constructor(service: PdfInspectorService);
    inspect(file: Express.Multer.File): Promise<import("./pdf-inspector.service").PreflightResult>;
}
