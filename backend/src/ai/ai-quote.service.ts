import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiQuoteService {
  private readonly logger = new Logger(AiQuoteService.name);
  private anthropic: Anthropic;
  private readonly model = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.anthropic = new Anthropic({ apiKey: apiKey || 'not-set' });
  }

  private async callClaude(prompt: string, systemPrompt: string): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) return this.fallbackQuote();
    try {
      const msg = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });
      return (msg.content[0] as any)?.text || this.fallbackQuote();
    } catch (e) {
      this.logger.warn('Claude API call failed', (e as any)?.message);
      return this.fallbackQuote();
    }
  }

  private fallbackQuote(): string {
    return JSON.stringify({
      product_type: 'flyer', quantity: 500, size: 'A5',
      material: 'Glossy 170gsm', color_mode: 'CMYK', sides: 'single',
      finishing: [], estimated_price: 89000,
      notes: 'AI тооцоолуур түр ажиллахгүй байна.',
      confidence: 0,
    });
  }

  async parseQuoteRequest(userMessage: string) {
    const systemPrompt = `Та хэвлэлийн захиалгын мэргэжилтэн юм.
Хэрэглэгчийн мессежийг уншаад дараах JSON форматаар хариулна уу. Зөвхөн JSON, өөр юм бичихгүй.

Боломжит product_type утгууд: business-card, flyer, brochure, poster, sticker, banner, book
Боломжит size утгууд: A6, A5, A4, A3, A2, A1, DL, 90x54mm, 1x2m, 2x3m, custom
Боломжит material утгууд: Glossy 130gsm, Glossy 170gsm, Matte 170gsm, Art card 250gsm, Art card 300gsm, Art card 350gsm, Vinyl
Боломжит color_mode утгууд: CMYK, 1C, BW
Боломжит sides утгууд: single, double
Боломжит finishing утгууд: matt_laminate, gloss_laminate, soft_touch, uv_coat, foil_gold, die_cut, fold

Монгол мөнгөний нэгжээр estimated_price тооцоол (жишээ: 500 A5 glossy флаер = 89000).
confidence: 0-100 хооронд.

{"product_type":"","quantity":0,"size":"","material":"","color_mode":"","sides":"","finishing":[],"estimated_price":0,"notes":"","confidence":0}`;

    const result = await this.callClaude(userMessage, systemPrompt);
    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return JSON.parse(this.fallbackQuote());
    }
  }

  async generateDescription(product: { name: string; category: string; material?: string }) {
    const systemPrompt = `Та хэвлэлийн бүтээгдэхүүний тайлбар бичдэг Монгол мэргэжилтэн. JSON-оор хариулна:
{"description":"150 тэмдэгтийн тайлбар","seo_description":"SEO тайлбар","features":["1","2","3"]}`;
    const result = await this.callClaude(
      `Бүтээгдэхүүн: ${product.name}, Ангилал: ${product.category}, Материал: ${product.material || ''}`,
      systemPrompt,
    );
    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        description: `${product.name} — мэргэжлийн хэвлэлийн бүтээгдэхүүн`,
        seo_description: `${product.name} захиалах | BizPrint`,
        features: ['Өндөр чанар', 'Хурдан хүргэлт', 'Боломжийн үнэ'],
      };
    }
  }

  async getDesignSuggestions(industry: string, productType: string) {
    const systemPrompt = `Та дизайны мэргэжилтэн. JSON-оор хариулна:
{"colors":["#hex1","#hex2","#hex3"],"fonts":["Inter"],"tips":["зөвлөмж 1","зөвлөмж 2","зөвлөмж 3"]}`;
    const result = await this.callClaude(
      `${industry} салбарт ${productType} дизайн. Зөвлөмж өг.`,
      systemPrompt,
    );
    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        colors: ['#1a1a2e', '#FF6B00', '#FFFFFF'],
        fonts: ['Inter', 'Roboto'],
        tips: ['Лого тод байршуулна', 'Утасны дугаар томоор', 'Хялбар дизайн сонгох'],
      };
    }
  }
}
