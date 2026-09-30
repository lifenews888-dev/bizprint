import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString,
  MaxLength, Min, Max,
} from 'class-validator';

/**
 * Глобал ValidationPipe нь whitelist + forbidNonWhitelisted тул нийтлэлийн
 * бүх талбар энд тодорхойлогдсон байх шаардлагатай. view_count, published_at,
 * reading_minutes, author_id зэрэг нь сервер тал дээр бодогддог тул
 * зориудаар ОРУУЛААГҮЙ — админ тэднийг гараар өөрчилж чадахгүй.
 *
 * `title`-ыг энд бичээгүй: create-д шаардлагатай, update-д сонголттой тул
 * хүү класс тус бүрдээ өөрөө тодорхойлно. (Ижил талбарыг дарж бичвэл
 * class-validator эцэг классын декораторуудыг хамт хуримтлуулдаг тул
 * IsNotEmpty/IsOptional хоёр зөрчилддөг.)
 */
class PostFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  slug?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600, { message: 'Тойм 600 тэмдэгтээс хэтрэхгүй' })
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray({ message: 'Таг нь массив байх ёстой' })
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  author_name?: string;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seo_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  seo_description?: string;
}

export class CreatePostDto extends PostFieldsDto {
  @IsString({ message: 'Гарчиг текст байх ёстой' })
  @IsNotEmpty({ message: 'Гарчиг оруулна уу' })
  @MaxLength(300, { message: 'Гарчиг 300 тэмдэгтээс хэтрэхгүй' })
  title: string;
}

export class UpdatePostDto extends PostFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Гарчиг 300 тэмдэгтээс хэтрэхгүй' })
  title?: string;
}

export class QueryPostsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** 1-ээс эхэлсэн хуудасны дугаар */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50, { message: 'Нэг хуудсанд дээд тал нь 50 нийтлэл' })
  limit?: number;
}

export class LimitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}
