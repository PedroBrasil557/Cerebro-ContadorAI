import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const inputSchema = z.object({ confirmation: z.literal('EXCLUIR') }).strict()

async function removeReceiptFiles(userId: string) {
  const admin = createAdminClient()
  const paths: string[] = []
  let offset = 0

  while (true) {
    const { data: folders, error } = await admin.storage.from('receipts').list(userId, { limit: 100, offset })
    if (error) throw error
    if (!folders?.length) break

    for (const folder of folders) {
      if (folder.metadata) paths.push(`${userId}/${folder.name}`)
      else {
        const { data: files, error: fileError } = await admin.storage.from('receipts').list(`${userId}/${folder.name}`, { limit: 1000 })
        if (fileError) throw fileError
        paths.push(...(files ?? []).filter((file) => file.metadata).map((file) => `${userId}/${folder.name}/${file.name}`))
      }
    }
    if (folders.length < 100) break
    offset += folders.length
  }

  if (paths.length > 0) {
    const { error } = await admin.storage.from('receipts').remove(paths)
    if (error) throw error
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    inputSchema.parse(await request.json())
    const admin = createAdminClient()
    const supabase = await createClient()

    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id,status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (subscriptionError) throw subscriptionError

    if (subscription?.stripe_subscription_id && subscription.status !== 'canceled') {
      await getStripe().subscriptions.cancel(subscription.stripe_subscription_id)
    }

    await removeReceiptFiles(user.id)
    const { error: cleanupError } = await admin.rpc('delete_account_data', { p_user_id: user.id })
    if (cleanupError) throw cleanupError

    await supabase.auth.signOut({ scope: 'global' })
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return successResponse({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
