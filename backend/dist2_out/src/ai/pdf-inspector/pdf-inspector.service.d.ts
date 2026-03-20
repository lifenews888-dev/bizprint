export interface PreflightIssue {
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
}
export interface PreflightResult {
    pages: number;
    text_length: number;
    info: any;
    issues: PreflightIssue[];
    score: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    summary: string;
    checks: {
        resolution: {
            status: string;
            detail: string;
        };
        color_mode: {
            status: string;
            detail: string;
        };
        bleed: {
            status: string;
            detail: string;
        };
        fonts: {
            status: string;
            detail: string;
        };
        page_size: {
            status: string;
            detail: string;
        };
        transparency: {
            status: string;
            detail: string;
        };
    };
}
export declare class PdfInspectorService {
    inspect(file: Buffer): Promise<PreflightResult>;
}
