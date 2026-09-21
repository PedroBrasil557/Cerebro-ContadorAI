export const MAX_OCR_FILE_SIZE = 5 * 1024 * 1024

export const OCR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type OcrImageType = (typeof OCR_ALLOWED_TYPES)[number]

export function isAllowedOcrImageType(value: string): value is OcrImageType {
  return (OCR_ALLOWED_TYPES as readonly string[]).includes(value)
}

export function detectOcrImageType(bytes: Uint8Array): OcrImageType | null {
  if (
    bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
  ) return 'image/jpeg'

  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) return 'image/png'

  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) return 'image/webp'

  return null
}

export function validateOcrImagePayload(type: string, size: number, bytes: Uint8Array) {
  if (!isAllowedOcrImageType(type)) throw new Error('Use uma imagem JPG, PNG ou WEBP.')
  if (!Number.isFinite(size) || size <= 0 || size > MAX_OCR_FILE_SIZE) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const detectedType = detectOcrImageType(bytes)
  if (!detectedType || detectedType !== type) {
    throw new Error('O conteúdo do arquivo não corresponde a uma imagem válida.')
  }

  return detectedType
}
