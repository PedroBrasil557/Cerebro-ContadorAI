import { z } from 'zod'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireFounder } from '@/lib/auth/platform'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const paramsSchema = z.object({ id: z.uuid() })
const inputSchema = z.object({ role: z.enum(['user', 'admin']) }).strict()
const resultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('changed'), previous_role: z.enum(['user', 'admin']), new_role: z.enum(['user', 'admin']) }),
  z.object({ status: z.literal('unchanged'), previous_role: z.enum(['user', 'admin']), new_role: z.enum(['user', 'admin']) }),
  z.object({ status: z.literal('forbidden') }),
  z.object({ status: z.literal('self_change_forbidden') }),
  z.object({ status: z.literal('founder_protected') }),
  z.object({ status: z.literal('invalid_role') }),
  z.object({ status: z.literal('not_found') }),
])

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireFounder()
    const { id: targetUserId } = paramsSchema.parse(await context.params)
    const { role } = inputSchema.parse(await request.json())

    if (targetUserId === user.id) {
      throw new ForbiddenError('O Founder não pode alterar o próprio papel.')
    }

    const { data, error } = await createAdminClient().rpc('set_platform_admin_role', {
      p_actor_user_id: user.id,
      p_target_user_id: targetUserId,
      p_new_role: role,
    })
    if (error) throw error

    const parsed = resultSchema.safeParse(data)
    if (!parsed.success) throw new Error('Resposta inválida da função de autoridade da plataforma.')

    switch (parsed.data.status) {
      case 'forbidden':
        throw new ForbiddenError('A autoridade Founder não pôde ser confirmada.')
      case 'self_change_forbidden':
        throw new ForbiddenError('O Founder não pode alterar o próprio papel.')
      case 'founder_protected':
        throw new ForbiddenError('O papel Founder não pode ser alterado por esta operação.')
      case 'invalid_role':
        throw new ValidationError('Apenas os papéis user e admin são permitidos.')
      case 'not_found':
        throw new NotFoundError('Perfil de destino não encontrado.')
      case 'changed':
      case 'unchanged':
        return successResponse({
          targetUserId,
          previousRole: parsed.data.previous_role,
          newRole: parsed.data.new_role,
          changed: parsed.data.status === 'changed',
        })
    }
  } catch (error) {
    return errorResponse(error, {
      feature: 'platform-role-management',
      route: '/api/admin/users/[id]/role',
      provider: 'supabase',
    })
  }
}
