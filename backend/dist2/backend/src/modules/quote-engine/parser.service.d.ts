export declare class ParserService {
    parse(fileUrl: string): Promise<{
        pages: number;
        size: string;
        color: string;
    }>;
}
