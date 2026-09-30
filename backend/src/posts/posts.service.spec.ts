import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PostsService, readingMinutes, slugifyTitle } from './posts.service';
import { Post } from './post.entity';

type MockRepo = {
  find: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  increment: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const makeRepo = (): MockRepo => ({
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((dto: unknown) => dto),
  save: jest.fn((dto: unknown) => Promise.resolve(dto)),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  increment: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn(),
});

const post = (over: Partial<Post> = {}): Post => ({
  id: 'p1', title: 'Гарчиг', slug: 'garchig', content: '', excerpt: '',
  thumbnail: '', category: '', tags: [], author_id: '', author_name: '',
  is_published: true, is_featured: false, published_at: new Date('2026-01-01'),
  reading_minutes: 1, seo_title: '', seo_description: '', view_count: 0,
  created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01'),
  ...over,
} as Post);

describe('slugifyTitle', () => {
  it('transliterates Mongolian Cyrillic instead of dropping it', () => {
    expect(slugifyTitle('Хэвлэлийн шинэ технологи')).toBe('hevleliin-shine-tehnologi');
  });

  it('handles ө and ү', () => {
    expect(slugifyTitle('Өнгөт хэвлэл үйлдвэр')).toBe('ongot-hevlel-uildver');
  });

  it('keeps latin titles readable', () => {
    expect(slugifyTitle('Offset vs Digital Printing')).toBe('offset-vs-digital-printing');
  });

  it('collapses punctuation and trims separators', () => {
    expect(slugifyTitle('  ...Хэвлэл!!! 2026...  ')).toBe('hevlel-2026');
  });

  it('returns empty string when nothing survives', () => {
    expect(slugifyTitle('!!!')).toBe('');
  });
});

describe('readingMinutes', () => {
  it('returns at least 1 minute for empty content', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes(null)).toBe(1);
  });

  it('ignores HTML tags when counting words', () => {
    const words = Array.from({ length: 400 }, () => 'үг').join(' ');
    expect(readingMinutes(`<p>${words}</p>`)).toBe(2);
  });
});

describe('PostsService', () => {
  let service: PostsService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: repo },
      ],
    }).compile();
    service = module.get<PostsService>(PostsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('derives a slug from a Mongolian title and stamps published_at', async () => {
      await service.create({ title: 'Хэвлэлийн зөвлөгөө', is_published: true }, 'admin-1');

      const saved = repo.save.mock.calls[0][0] as Post;
      expect(saved.slug).toBe('hevleliin-zovlogoo');
      expect(saved.author_id).toBe('admin-1');
      expect(saved.published_at).toBeInstanceOf(Date);
    });

    it('leaves published_at null for a draft', async () => {
      await service.create({ title: 'Драфт' });
      const saved = repo.save.mock.calls[0][0] as Post;
      expect(saved.published_at).toBeNull();
    });

    it('appends a counter when the slug already exists', async () => {
      repo.findOne
        .mockResolvedValueOnce(post({ id: 'other', slug: 'hevlel' }))
        .mockResolvedValueOnce(null);

      await service.create({ title: 'Хэвлэл' });
      expect((repo.save.mock.calls[0][0] as Post).slug).toBe('hevlel-2');
    });

    it('falls back to a default slug when the title has no usable characters', async () => {
      await service.create({ title: '???' });
      expect((repo.save.mock.calls[0][0] as Post).slug).toBe('niitlel');
    });

    it('computes reading_minutes from the content', async () => {
      const words = Array.from({ length: 600 }, () => 'word').join(' ');
      await service.create({ title: 'Long', content: words });
      expect((repo.save.mock.calls[0][0] as Post).reading_minutes).toBe(3);
    });
  });

  describe('findPublished', () => {
    it('filters to published posts and paginates', async () => {
      await service.findPublished({ page: 2, limit: 5 });

      const args = repo.findAndCount.mock.calls[0][0];
      expect(args.where).toMatchObject({ is_published: true });
      expect(args.skip).toBe(5);
      expect(args.take).toBe(5);
    });

    it('caps limit at 50', async () => {
      await service.findPublished({ limit: 500 } as never);
      expect(repo.findAndCount.mock.calls[0][0].take).toBe(50);
    });

    it('builds an OR search across title, excerpt and content', async () => {
      await service.findPublished({ search: 'офсет' });
      const where = repo.findAndCount.mock.calls[0][0].where as unknown[];
      expect(Array.isArray(where)).toBe(true);
      expect(where).toHaveLength(3);
    });

    it('reports total pages', async () => {
      repo.findAndCount.mockResolvedValueOnce([[post()], 13]);
      const res = await service.findPublished({ limit: 5 });
      expect(res).toMatchObject({ total: 13, pages: 3, page: 1, limit: 5 });
    });
  });

  describe('findFeatured', () => {
    it('returns featured posts when there are enough', async () => {
      repo.find.mockResolvedValueOnce([post({ id: 'a' }), post({ id: 'b' }), post({ id: 'c' })]);
      const res = await service.findFeatured(3);
      expect(res.map(p => p.id)).toEqual(['a', 'b', 'c']);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });

    it('tops up with latest posts without duplicating', async () => {
      repo.find
        .mockResolvedValueOnce([post({ id: 'a' })])
        .mockResolvedValueOnce([post({ id: 'a' }), post({ id: 'b' }), post({ id: 'c' })]);

      const res = await service.findFeatured(3);
      expect(res.map(p => p.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('findPublishedBySlug', () => {
    it('throws when the post is a draft or missing', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findPublishedBySlug('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRelated', () => {
    it('returns an empty list for an unknown slug', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findRelated('nope')).resolves.toEqual([]);
    });

    it('excludes the current post from the same-category pool', async () => {
      repo.findOne.mockResolvedValueOnce(post({ id: 'p1', category: 'Технологи' }));
      repo.find
        .mockResolvedValueOnce([post({ id: 'p1' }), post({ id: 'p2' }), post({ id: 'p3' })])
        .mockResolvedValueOnce([post({ id: 'p4' })]);

      const res = await service.findRelated('garchig', 3);
      expect(res.map(p => p.id)).not.toContain('p1');
    });
  });

  describe('update', () => {
    it('throws for a missing post', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.update('missing', { title: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('keeps the existing slug when only the title changes', async () => {
      repo.findOne
        .mockResolvedValueOnce(post({ slug: 'old-slug' }))
        .mockResolvedValueOnce(post({ slug: 'old-slug' }));

      await service.update('p1', { title: 'Шинэ гарчиг' });
      expect(repo.update.mock.calls[0][1]).not.toHaveProperty('slug');
    });

    it('uniquifies an explicitly changed slug', async () => {
      repo.findOne
        .mockResolvedValueOnce(post({ slug: 'old-slug' }))   // existing
        .mockResolvedValueOnce(post({ id: 'other', slug: 'new-slug' })) // clash
        .mockResolvedValueOnce(null)                          // new-slug-2 free
        .mockResolvedValueOnce(post({ slug: 'new-slug-2' })); // reload
      await service.update('p1', { title: 'x', slug: 'new-slug' });
      expect(repo.update.mock.calls[0][1].slug).toBe('new-slug-2');
    });

    it('stamps published_at the first time a draft is published', async () => {
      repo.findOne
        .mockResolvedValueOnce(post({ is_published: false, published_at: null }))
        .mockResolvedValueOnce(post());

      await service.update('p1', { title: 'x', is_published: true });
      expect(repo.update.mock.calls[0][1].published_at).toBeInstanceOf(Date);
    });

    it('does not move published_at when re-publishing', async () => {
      const original = new Date('2026-02-02');
      repo.findOne
        .mockResolvedValueOnce(post({ is_published: false, published_at: original }))
        .mockResolvedValueOnce(post());

      await service.update('p1', { title: 'x', is_published: true });
      expect(repo.update.mock.calls[0][1]).not.toHaveProperty('published_at');
    });

    it('recomputes reading_minutes when content changes', async () => {
      repo.findOne.mockResolvedValueOnce(post()).mockResolvedValueOnce(post());
      const words = Array.from({ length: 400 }, () => 'word').join(' ');
      await service.update('p1', { title: 'x', content: words });
      expect(repo.update.mock.calls[0][1].reading_minutes).toBe(2);
    });
  });

  describe('remove', () => {
    it('throws when nothing was deleted', async () => {
      repo.delete.mockResolvedValueOnce({ affected: 0 });
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementView', () => {
    it('only counts views on published posts', async () => {
      await service.incrementView('garchig');
      expect(repo.increment).toHaveBeenCalledWith(
        { slug: 'garchig', is_published: true }, 'view_count', 1,
      );
    });
  });

  describe('listCategories', () => {
    it('groups published posts by category', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ category: 'Технологи', count: 4 }]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.listCategories()).resolves.toEqual([{ category: 'Технологи', count: 4 }]);
      expect(qb.where).toHaveBeenCalledWith('p.is_published = true');
    });
  });
});
