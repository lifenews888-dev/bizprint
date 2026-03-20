import { QuotesV2Service } from './quotes-v2.service';
import { MailService } from '../mail/mail.service';
export declare class QuotesV2Controller {
    private svc;
    private mail;
    constructor(svc: QuotesV2Service, mail: MailService);
    create(body: any): Promise<import("./quote-v2.entity").QuoteV2>;
    findAll(date?: string): Promise<import("./quote-v2.entity").QuoteV2[]>;
    findToday(): Promise<import("./quote-v2.entity").QuoteV2[]>;
    findOne(id: string): Promise<import("./quote-v2.entity").QuoteV2>;
    update(id: string, body: any): Promise<import("./quote-v2.entity").QuoteV2>;
    sendDailyReport(body: {
        admin_email: string;
    }): Promise<{
        sent: number;
    }>;
}
