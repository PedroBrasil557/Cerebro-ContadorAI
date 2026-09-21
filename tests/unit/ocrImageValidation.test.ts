import { describe, expect, it } from 'vitest'
import { detectOcrImageType, validateOcrImagePayload } from '../../lib/ocr/imageValidation'

describe('OCR image validation', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00])
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])

  it('detects supported image signatures', () => {
    expect(detectOcrImageType(jpeg)).toBe('image/jpeg')
    expect(detectOcrImageType(png)).toBe('image/png')
    expect(detectOcrImageType(webp)).toBe('image/webp')
  })

  it('rejects MIME spoofing', () => {
    expect(() => validateOcrImagePayload('image/png', jpeg.length, jpeg)).toThrow()
  })

  it('rejects unknown bytes', () => {
    expect(() => validateOcrImagePayload('image/jpeg', 4, new Uint8Array([1, 2, 3, 4]))).toThrow()
  })

  it('accepts a matching supported payload', () => {
    expect(validateOcrImagePayload('image/jpeg', jpeg.length, jpeg)).toBe('image/jpeg')
  })
})
