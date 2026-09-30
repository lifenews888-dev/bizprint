import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto, QueryPostsDto, UpdatePostDto } from './dto/post.dto';

/**
 * Монгол кирилл → латин. Өмнөх хувилбар нь `[^a-z0-9-]` бүхнийг хаядаг
 * байсан тул монгол гарчиг бүр хоосон slug болж, зөвхөн timestamp үлддэг
 * ("-mlk3x9"). Тиймээс гарчгийг үсэгчлэн хөрвүүлнэ.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Гарчгаас URL-д тохирох slug гаргана (кириллийг латинчилна). */
export function slugifyTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .split('')
    .map(ch => (ch in CYRILLIC_TO_LATIN ? CYRILLIC_TO_LATIN[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** HTML-ээс үгийн тоо бодож, минутаар унших хугацаа гаргана. */
export function readingMinutes(content?: string | null): number {
  const text = (content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim();
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface PostListResult {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DEFAULT_LIMIT = 12;

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private repo: Repository<Post>) {}

  /** Админ — драфт орсон бүх нийтлэл */
  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  /** Нийтийн жагсаалт — ангилал / таг / хайлт / хуудаслалт */
  async findPublished(query: QueryPostsDto = {}): Promise<PostListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || DEFAULT_LIMIT));

    const base: FindOptionsWhere<Post> = { is_published: true };
    if (query.category) base.category = query.category;
    if (query.tag) base.tags = ArrayContains([query.tag]);

    // Массив дамжуулбал TypeORM үүнийг OR болгож нэгтгэдэг.
    const search = query.search?.trim();
    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = search
      ? [
        { ...base, title: ILike(`%${search}%`) },
        { ...base, excerpt: ILike(`%${search}%`) },
        { ...base, content: ILike(`%${search}%`) },
      ]
      : base;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { published_at: 'DESC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  /**
   * Нүүр хуудсанд — онцолсон нийтлэлүүд эхэлж, дараа нь шинэ нийтлэлүүдээр
   * нөхөж limit-ийг дүүргэнэ.
   */
  async findFeatured(limit = 3): Promise<Post[]> {
    const take = Math.min(12, Math.max(1, limit));

    const featured = await this.repo.find({
      where: { is_published: true, is_featured: true },
      order: { published_at: 'DESC', created_at: 'DESC' },
      take,
    });
    if (featured.length >= take) return featured;

    const latest = await this.repo.find({
      where: { is_published: true },
      order: { published_at: 'DESC', created_at: 'DESC' },
      take: take + featured.length,
    });

    const seen = new Set(featured.map(p => p.id));
    for (const post of latest) {
      if (featured.length >= take) break;
      if (!seen.has(post.id)) { featured.push(post); seen.add(post.id); }
    }
    return featured;
  }

  /** Шүүлтүүрийн chip-үүдэд — нийтлэгдсэн нийтлэлийн ангиллууд тоотойгоо */
  listCategories(): Promise<Array<{ category: string; count: number }>> {
    return this.repo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)::int', 'count')
      .where('p.is_published = true')
      .andWhere('p.category IS NOT NULL')
      .andWhere("p.category <> ''")
      .groupBy('p.category')
      .orderBy('count', 'DESC')
      .getRawMany<{ category: string; count: number }>();
  }

  /** Нийтийн дэлгэрэнгүй — драфт бол 404 */
  async findPublishedBySlug(slug: string): Promise<Post> {
    const post = await this.repo.findOne({ where: { slug, is_published: true } });
    if (!post) throw new NotFoundException('Нийтлэл олдсонгүй');
    return post;
  }

  /** Админ — драфт ч гэсэн slug-аар нь харах */
  async findBySlug(slug: string): Promise<Post> {
    const post = await this.repo.findOne({ where: { slug } });
    if (!post) throw new NotFoundException('Нийтлэл олдсонгүй');
    return post;
  }

  /** Ижил ангиллын нийтлэлүүд; байхгүй бол шинэ нийтлэлүүдээр нөхнө */
  async findRelated(slug: string, limit = 3): Promise<Post[]> {
    const take = Math.min(6, Math.max(1, limit));
    const current = await this.repo.findOne({ where: { slug } });
    if (!current) return [];

    const pool = await this.repo.find({
      where: current.category
        ? { is_published: true, category: current.category }
        : { is_published: true },
      order: { published_at: 'DESC', created_at: 'DESC' },
      take: take + 1,
    });

    const related = pool.filter(p => p.id !== current.id).slice(0, take);
    if (related.length >= take) return related;

    const latest = await this.repo.find({
      where: { is_published: true },
      order: { published_at: 'DESC', created_at: 'DESC' },
      take: take + related.length + 1,
    });

    const seen = new Set([current.id, ...related.map(p => p.id)]);
    for (const post of latest) {
      if (related.length >= take) break;
      if (!seen.has(post.id)) { related.push(post); seen.add(post.id); }
    }
    return related;
  }

  async create(dto: CreatePostDto, authorId?: string): Promise<Post> {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    const published = dto.is_published === true;

    return this.repo.save(this.repo.create({
      ...dto,
      slug,
      author_id: authorId,
      published_at: published ? new Date() : null,
      reading_minutes: readingMinutes(dto.content),
    }));
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Нийтлэл олдсонгүй');

    const patch: Partial<Post> = { ...dto };

    // Slug-ийг зөвхөн ил заасан үед л сольдог — гарчиг зассан болгонд
    // permalink солигдвол хуучин линкүүд эвдэрнэ.
    if (dto.slug && dto.slug !== existing.slug) {
      patch.slug = await this.uniqueSlug(dto.slug, id);
    } else {
      delete patch.slug;
    }

    if (dto.content !== undefined) {
      patch.reading_minutes = readingMinutes(dto.content);
    }

    // Анх нийтлэх үед published_at тавина. Драфт болгоход хуучин огноог
    // хадгална — дахин нийтлэхэд анхны нийтэлсэн огноо алдагдахгүй.
    if (dto.is_published === true && !existing.published_at) {
      patch.published_at = new Date();
    }

    await this.repo.update(id, patch);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Нийтлэл олдсонгүй');
    return updated;
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Нийтлэл олдсонгүй');
    return { success: true };
  }

  /** Зөвхөн нийтлэгдсэн нийтлэлийн уншилт тоологдоно (драфт preview тоологдохгүй) */
  async incrementView(slug: string) {
    await this.repo.increment({ slug, is_published: true }, 'view_count', 1);
  }

  /**
   * Давхардахгүй slug. Ижил slug байвал `-2`, `-3` … нэмнэ; timestamp
   * нэмэхээс илүү уншигдахуйц URL гарна.
   */
  private async uniqueSlug(source: string, excludeId?: string): Promise<string> {
    const root = slugifyTitle(source) || 'niitlel';
    let candidate = root;

    for (let n = 2; n <= 99; n++) {
      const clash = await this.repo.findOne({ where: { slug: candidate } });
      if (!clash || clash.id === excludeId) return candidate;
      candidate = `${root}-${n}`;
    }
    return `${root}-${Date.now().toString(36)}`;
  }
}
