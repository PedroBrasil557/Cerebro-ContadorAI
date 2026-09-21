import { ForbiddenError, RateLimitError, ValidationError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { MAX_OCR_FILE_SIZE, isAllowedOcrImageType, validateOcrImagePayload } from '@/lib/ocr/imageValidation'
import { parseReceiptText } from '@/lib/ocr/receiptParser'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIN_AUTO_APPLY_CONFIDENCE = 0.65

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) throw new ValidationError('Envie uma imagem de cupom.')
    if (!isAllowedOcrImageType(file.type)) throw new ValidationError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size === 0 || file.size > MAX_OCR_FILE_SIZE) {
      throw new ValidationError('A imagem deve ter no máximo 5 MB.')
    }

    const billing = await getUserEntitlements(user.id)
    if (!billing.access.canAccessPersonal) {
      throw new ForbiddenError('O reconhecimento de cupons pertence ao produto Pessoal.')
    }

    const imageBytes = new Uint8Array(await file.arrayBuffer())
    try {
      validateOcrImagePayload(file.type, file.size, imageBytes)
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : 'Imagem inválida.')
    }

    const usage = await checkUsageLimit(user.id, 'ocr', billing.entitlements)
    if (!usage.allowed) throw new RateLimitError('Limite mensal de OCR atingido.')

    const { default: Tesseract } = await import('tesseract.js')
    const result = await Tesseract.recognize(Buffer.from(imageBytes), 'por')
    const parsed = parseReceiptText(result.data.text)
    const tesseractConfidence = Math.min(Math.max(result.data.confidence / 100, 0), 1)
    const confidence = Math.min(parsed.confidence, tesseractConfidence)
    const requiresManualReview = parsed.items.length === 0 || confidence < MIN_AUTO_APPLY_CONFIDENCE

    return successResponse({
      items: requiresManualReview ? [] : parsed.items,
      detectedItems: parsed.items.length,
      confidence,
      requiresManualReview,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'ocr', route: '/api/ocr', provider: 'ocr' })
  }
}
