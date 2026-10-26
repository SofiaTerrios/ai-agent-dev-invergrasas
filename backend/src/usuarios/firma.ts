import { BadRequestException } from '@nestjs/common';

export const FIRMA_MAX_BYTES = 300 * 1024;

const DATA_URL = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/;

// Parses the signature image sent as a data URL.
export function parseFirma(dataUrl: string) {
  const match = DATA_URL.exec(dataUrl);
  if (!match) {
    throw new BadRequestException('La firma debe ser una imagen PNG o JPEG');
  }
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > FIRMA_MAX_BYTES) {
    throw new BadRequestException('La firma debe pesar máximo 300 KB');
  }
  return { firma: bytes, firma_mime: match[1] };
}

export function firmaDataUrl(firma: Uint8Array, mime: string) {
  return `data:${mime};base64,${Buffer.from(firma).toString('base64')}`;
}
