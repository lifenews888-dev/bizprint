import { BadRequestException, Controller, Get, NotFoundException, Param, Request, Res, UseGuards } from '@nestjs/common';
import { realpathSync, statSync } from 'fs';
import type { Response } from 'express';
import { extname, isAbsolute, relative, resolve } from 'path';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { PrintInquiryService } from './print-inquiry.service';

const safeDownloadName = (filename: string): string => {
  const safeName = (filename || 'download')
    .replace(/[\r\n"]/g, '_')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[^\w.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim()
    .slice(0, 180);
  const baseName = safeName.split('.')[0]?.replace(/[ .]+$/g, '').toUpperCase();
  const isReservedDevice = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(baseName || '');
  if (!baseName && safeName && !/^\.+$/.test(safeName)) {
    return `download${extname(safeName) || extname(String(filename || '').replace(/[\\/]/g, '_')) || ''}`;
  }
  return safeName && !/^\.+$/.test(safeName) && !isReservedDevice ? safeName : 'download';
};

const safeDownloadUtf8Name = (filename: string): string => {
  const safeName = (filename || 'download')
    .replace(/[\r\n"]/g, '_')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\\/]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim()
    .slice(0, 180);
  const baseName = safeName.split('.')[0]?.replace(/[ .]+$/g, '').toUpperCase();
  const isReservedDevice = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(baseName || '');
  if (!baseName && safeName && !/^\.+$/.test(safeName)) {
    return `download${extname(safeName) || extname(String(filename || '').replace(/[\\/]/g, '_')) || ''}`;
  }
  return safeName && !/^\.+$/.test(safeName) && !isReservedDevice ? safeName : 'download';
};

const encodeRfc5987Value = (value: string): string =>
  encodeURIComponent(value).replace(/['()*]/g, char =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const contentDispositionFilename = (filename: string): string => {
  const fallbackName = safeDownloadName(filename);
  const utf8Name = safeDownloadUtf8Name(filename);
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeRfc5987Value(utf8Name)}`;
};

const DOWNLOAD_MIME_BY_EXTENSION = new Map<string, string>([
  ['.pdf', 'application/pdf'],
  ['.ai', 'application/postscript'],
  ['.psd', 'image/vnd.adobe.photoshop'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.eps', 'application/postscript'],
  ['.zip', 'application/zip'],
]);

const downloadContentType = (filename: string): string =>
  DOWNLOAD_MIME_BY_EXTENSION.get(extname(filename || '').toLowerCase()) || 'application/octet-stream';

const isInsideInquiryUploadRoot = (absolutePath: string): boolean => {
  const uploadRoot = resolve(process.cwd(), 'uploads', 'inquiries');
  const resolvedPath = resolve(absolutePath || '');
  const rel = relative(uploadRoot, resolvedPath);
  return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
};

const isExistingFile = (absolutePath: string): boolean => {
  try {
    return statSync(absolutePath).isFile();
  } catch {
    return false;
  }
};

const isRealFileInsideInquiryUploadRoot = (absolutePath: string): boolean => {
  try {
    const uploadRoot = realpathSync(resolve(process.cwd(), 'uploads', 'inquiries'));
    const realFilePath = realpathSync(absolutePath);
    const rel = relative(uploadRoot, realFilePath);
    return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
  } catch {
    return false;
  }
};

@Controller('uploads/inquiries')
export class InquiryUploadController {
  constructor(private readonly svc: PrintInquiryService) {}

  @Get(':filename')
  @UseGuards(OptionalJwtAuthGuard)
  async getInquiryUpload(
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const file = await this.svc.resolveInquiryUpload(filename, req?.user);
    if (!file || typeof file !== 'object') throw new BadRequestException('Файлын мэдээлэл буруу байна');
    const resolvedFile = file as { filename?: unknown; absolutePath?: unknown };
    if (typeof resolvedFile.absolutePath !== 'string' || (typeof resolvedFile.filename !== 'string' && typeof resolvedFile.filename !== 'number')) {
      throw new BadRequestException('Файлын мэдээлэл буруу байна');
    }
    const safeFilename = String(resolvedFile.filename || 'download');
    if (!isInsideInquiryUploadRoot(resolvedFile.absolutePath)) throw new BadRequestException('Файлын зам буруу байна');
    if (!isExistingFile(resolvedFile.absolutePath)) throw new NotFoundException('Файл олдсонгүй');
    if (!isRealFileInsideInquiryUploadRoot(resolvedFile.absolutePath)) throw new BadRequestException('Файлын зам буруу байна');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', downloadContentType(safeFilename));
    res.setHeader('Content-Disposition', contentDispositionFilename(safeFilename));
    return res.sendFile(resolvedFile.absolutePath);
  }
}
