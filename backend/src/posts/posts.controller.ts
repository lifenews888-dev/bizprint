import { Controller, Get, Post as HttpPost, Patch, Delete, Param, Body, Query, Req, HttpCode, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, LimitDto, QueryPostsDto, UpdatePostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** JwtStrategy.validate-ийн буцаадаг хэлбэр */
interface AuthedRequest {
  user?: { id?: string; email?: string; role?: string };
}

@Controller('posts')
export class PostsController {
  constructor(private svc: PostsService) {}

  /**
   * Нийтийн жагсаалт. { items, total, page, limit, pages } буцаана.
   *
   * ⚠ Маршрутын дараалал: доорх `:slug` нь бүх нэг хэсэгтэй замыг залгидаг тул
   * `featured`, `categories`, `all` зэрэг статик замууд ӨМНӨ нь байх ёстой.
   */
  @Get()
  findPublished(@Query() query: QueryPostsDto) {
    return this.svc.findPublished(query);
  }

  /** Нүүр хуудсанд — онцолсон / шинэ нийтлэлүүд */
  @Get('featured')
  findFeatured(@Query() query: LimitDto) {
    return this.svc.findFeatured(query.limit || 3);
  }

  /** Шүүлтүүрийн ангиллууд тоотойгоо */
  @Get('categories')
  listCategories() {
    return this.svc.listCategories();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findAll() {
    return this.svc.findAll();
  }

  /** Админ preview — драфт нийтлэлийг харах */
  @Get('draft/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findDraft(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Get(':slug/related')
  findRelated(@Param('slug') slug: string, @Query() query: LimitDto) {
    return this.svc.findRelated(slug, query.limit || 3);
  }

  /**
   * Дэлгэрэнгүй. Үзэлт ЭНД тоологдохгүй: хуудас нь server-side render
   * болдог тул crawler болон ISR revalidate бүр тоог хөөрөгдөнө. Клиент
   * `POST :slug/view`-ээр тоолуулна.
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findPublishedBySlug(slug);
  }

  /** Бодит уншигч хуудсыг үзсэнийг тоолно (нийтлэгдсэн нийтлэлд л) */
  @HttpPost(':slug/view')
  @HttpCode(204)
  async countView(@Param('slug') slug: string) {
    await this.svc.incrementView(slug);
  }

  @HttpPost()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  create(@Body() dto: CreatePostDto, @Req() req: AuthedRequest) {
    return this.svc.create(dto, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
