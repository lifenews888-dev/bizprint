import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { InquiryUploadController } from './inquiry-upload.controller';

describe('InquiryUploadController', () => {
  const service = {
    resolveInquiryUpload: jest.fn(),
  };

  const makeResponse = () => ({
    setHeader: jest.fn(),
    sendFile: jest.fn((path: string) => ({ sent: path })),
  });

  const makeStoredUpload = (filename: string) => {
    const dir = join(process.cwd(), 'uploads', 'inquiries', `jest-${Date.now()}-${Math.round(Math.random() * 1e9)}`);
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, filename);
    writeFileSync(filePath, 'test');
    return { dir, filePath };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serves authorized inquiry files with private no-store headers', async () => {
    const { dir, filePath } = makeStoredUpload('job.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'job.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    const result = await controller.getInquiryUpload(
      'job.pdf',
      { user: { id: 'customer-1' } },
      res as any,
    );

    expect(service.resolveInquiryUpload).toHaveBeenCalledWith('job.pdf', { id: 'customer-1' });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store, max-age=0');
    expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="job.pdf"; filename*=UTF-8\'\'job.pdf');
    expect(res.sendFile).toHaveBeenCalledWith(filePath);
    expect(result).toEqual({ sent: filePath });
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes undefined user context when request is missing', async () => {
    const { dir, filePath } = makeStoredUpload('guest.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'guest.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('guest.pdf', undefined as any, res as any);

    expect(service.resolveInquiryUpload).toHaveBeenCalledWith('guest.pdf', undefined);
    expect(res.sendFile).toHaveBeenCalledWith(filePath);
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects malformed resolved upload metadata before path checks', async () => {
    service.resolveInquiryUpload.mockResolvedValue(null);
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('bad.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('rejects resolved upload metadata with non-scalar fields', async () => {
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: 'job.pdf',
      absolutePath: { path: 'job.pdf' },
    });
    await expect(controller.getInquiryUpload('job.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: { name: 'job.pdf' },
      absolutePath: join(process.cwd(), 'uploads', 'inquiries', 'job.pdf'),
    });
    await expect(controller.getInquiryUpload('job.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('returns not found when the resolved file is missing from disk', async () => {
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'missing.pdf',
      absolutePath: join(process.cwd(), 'uploads', 'inquiries', `bizprint-missing-${Date.now()}.pdf`),
    });
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('missing.pdf', { user: { id: 'customer-1' } }, makeResponse() as any))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects resolved files outside the inquiry upload directory', async () => {
    const dir = join(tmpdir(), `bizprint-outside-upload-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, 'outside.pdf');
    writeFileSync(filePath, 'test');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'outside.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('outside.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(res.sendFile).not.toHaveBeenCalled();
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects outside resolved paths before checking whether the file exists', async () => {
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'outside.pdf',
      absolutePath: join(tmpdir(), `bizprint-missing-outside-${Date.now()}.pdf`),
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('outside.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('rejects files that resolve outside uploads through a junction', async () => {
    const outsideDir = join(tmpdir(), `bizprint-outside-realpath-${Date.now()}`);
    const junctionParent = join(process.cwd(), 'uploads', 'inquiries', `jest-junction-parent-${Date.now()}`);
    const junctionPath = join(junctionParent, 'link');
    mkdirSync(outsideDir, { recursive: true });
    mkdirSync(junctionParent, { recursive: true });
    const outsideFile = join(outsideDir, 'outside.pdf');
    writeFileSync(outsideFile, 'test');
    symlinkSync(outsideDir, junctionPath, 'junction');
    const resolvedPath = join(junctionPath, 'outside.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'outside.pdf',
      absolutePath: resolvedPath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('outside.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(res.sendFile).not.toHaveBeenCalled();
    rmSync(junctionParent, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  });

  it('does not send directories as inquiry downloads', async () => {
    const dir = join(process.cwd(), 'uploads', 'inquiries', `jest-dir-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'folder.pdf',
      absolutePath: dir,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await expect(controller.getInquiryUpload('folder.pdf', { user: { id: 'customer-1' } }, res as any))
      .rejects.toBeInstanceOf(NotFoundException);

    expect(res.sendFile).not.toHaveBeenCalled();
    rmSync(dir, { recursive: true, force: true });
  });

  it('sanitizes download filenames before writing content-disposition', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'bad"name\r\n.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="bad_name_.pdf"; filename*=UTF-8\'\'bad_name_.pdf');
    rmSync(dir, { recursive: true, force: true });
  });

  it('preserves UTF-8 download filenames with an ASCII fallback', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'загвар.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="download.pdf"; filename*=UTF-8''${encodeURIComponent('загвар.pdf')}`,
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it('RFC5987-encodes special characters in UTF-8 download filenames', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: "загвар (v1)*'final'.pdf",
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="v1_final_.pdf"; filename*=UTF-8\'\'%D0%B7%D0%B0%D0%B3%D0%B2%D0%B0%D1%80%20%28v1%29%2A%27final%27.pdf',
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it('collapses repeated unsafe ASCII fallback separators', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'bad/// name***final.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="bad_name_final.pdf"; filename*=UTF-8\'\'bad_%20name%2A%2A%2Afinal.pdf',
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it('strips non-whitespace control characters from download filenames', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'bad\u0007name\u001F.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="badname.pdf"; filename*=UTF-8\'\'badname.pdf');
    rmSync(dir, { recursive: true, force: true });
  });

  it('falls back to a safe download filename when sanitized name is blank', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: '\u0007\u001F',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="download"; filename*=UTF-8\'\'download');
    rmSync(dir, { recursive: true, force: true });
  });

  it('falls back to a safe download filename when sanitized name is only separators', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: '   ',
      absolutePath: filePath,
    });
    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);
    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: '..',
      absolutePath: filePath,
    });
    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="download"; filename*=UTF-8\'\'download');
    expect(res.setHeader).toHaveBeenCalledTimes(10);
    rmSync(dir, { recursive: true, force: true });
  });

  it('falls back to a safe download filename for reserved device names', async () => {
    const { dir, filePath } = makeStoredUpload('stored.pdf');
    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: 'CON.pdf',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);
    service.resolveInquiryUpload.mockResolvedValueOnce({
      filename: 'NUL .zip',
      absolutePath: filePath,
    });
    await controller.getInquiryUpload('stored.pdf', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="download"; filename*=UTF-8\'\'download');
    rmSync(dir, { recursive: true, force: true });
  });

  it('falls back to octet-stream for unknown download extensions', async () => {
    const { dir, filePath } = makeStoredUpload('stored.bin');
    service.resolveInquiryUpload.mockResolvedValue({
      filename: 'stored.bin',
      absolutePath: filePath,
    });
    const res = makeResponse();
    const controller = new InquiryUploadController(service as any);

    await controller.getInquiryUpload('stored.bin', { user: { id: 'customer-1' } }, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    rmSync(dir, { recursive: true, force: true });
  });
});
