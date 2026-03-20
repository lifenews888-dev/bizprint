import { Repository } from 'typeorm';
import { QuoteV2 } from './quote-v2.entity';
export declare class QuotesV2Service {
    private repo;
    constructor(repo: Repository<QuoteV2>);
    generateNumber(): Promise<string>;
    create(data: Partial<QuoteV2>): Promise<QuoteV2>;
    findAll(): Promise<QuoteV2[]>;
    findOne(id: string): Promise<QuoteV2>;
    findByNumber(quote_number: string): Promise<QuoteV2>;
    findToday(): Promise<QuoteV2[]>;
    update(id: string, data: Partial<QuoteV2>): Promise<QuoteV2>;
    markExpired(): Promise<void>;
}
