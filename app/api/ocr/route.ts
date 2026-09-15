import { RateLimitError, ValidationError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { parseReceiptText } from '@/lib/ocr/receiptParser'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) throw new ValidationError('Envie uma imagem de cupom.')
    if (!ALLOWED_TYPES.has(file.type)) throw new ValidationError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new ValidationError('A imagem deve ter no máximo 5 MB.')
    }

    const billing = await getUserEntitlements(user.id)
    const usage = await checkUsageLimit(user.id, 'ocr', billing.plan)
    if (!usage.allowed) throw new RateLimitError('Limite mensal de OCR atingido.')

    const { default: Tesseract } = await import('tesseract.js')
    const result = await Tesseract.recognize(Buffer.from(await file.arrayBuffer()), 'por')
    const parsed = parseReceiptText(result.data.text)
    const confidence = Math.min(parsed.confidence, Math.max(result.data.confidence / 100, 0))
    const requiresManualReview = parsed.items.length === 0 || confidence < 0.5

    return successResponse({
      items: parsed.items,
      confidence,
      requiresManualReview,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'ocr', route: '/api/ocr', provider: 'ocr' })
  }
}
