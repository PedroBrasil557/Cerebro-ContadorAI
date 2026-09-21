// src/services/shoppingService.ts
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { ShoppingItem } from '@/types_db'
import {
  validateShoppingAmount,
  validateShoppingItemName,
  validateShoppingQuantity,
} from '@/core/finance/shopping'
import {
  MAX_OCR_FILE_SIZE,
  isAllowedOcrImageType,
  validateOcrImagePayload,
} from '@/lib/ocr/imageValidation'

type NewShoppingItem = Pick<ShoppingItem, 'session_id' | 'name' | 'category' | 'estimated_price'>
  & Partial<Omit<ShoppingItem, 'id' | 'session_id' | 'name' | 'category' | 'estimated_price'>>

type ShoppingItemUpdates = Partial<Pick<ShoppingItem,
  | 'name'
  | 'category'
  | 'estimated_price'
  | 'actual_price'
  | 'quantity'
  | 'is_essential'
  | 'is_purchased'
  | 'price_variation_pct'
>>

async function requireUser(supabase: SupabaseClient): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Usuário não autenticado')
  return user
}

async function requireOwnedSession(supabase: SupabaseClient, userId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('monthly_shopping_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Sessão de compras não encontrada')
}

async function requireOwnedItem(supabase: SupabaseClient, userId: string, itemId: string) {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('session_id')
    .eq('id', itemId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Item não encontrado')
  await requireOwnedSession(supabase, userId, data.session_id)
  return data.session_id as string
}

function sanitizeCategory(value: string | null | undefined) {
  const category = value?.replace(/\s+/g, ' ').trim() || 'Geral'
  return category.slice(0, 80)
}

function sanitizeVariation(value: number | null | undefined) {
  if (value == null) return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || Math.abs(parsed) > 100_000) {
    throw new Error('Variação de preço inválida.')
  }
  return Number(parsed.toFixed(2))
}

function buildNewItemPayload(itemData: NewShoppingItem) {
  return {
    session_id: itemData.session_id,
    name: validateShoppingItemName(itemData.name),
    category: sanitizeCategory(itemData.category),
    estimated_price: validateShoppingAmount(itemData.estimated_price, { label: 'preço estimado' }),
    actual_price: itemData.actual_price == null
      ? null
      : validateShoppingAmount(itemData.actual_price, { allowZero: true, label: 'preço real' }),
    quantity: validateShoppingQuantity(itemData.quantity),
    is_essential: itemData.is_essential ?? true,
    is_purchased: itemData.is_purchased ?? false,
    price_variation_pct: sanitizeVariation(itemData.price_variation_pct),
  }
}

function buildItemUpdates(updates: ShoppingItemUpdates) {
  const payload: ShoppingItemUpdates = {}

  if (updates.name !== undefined) payload.name = validateShoppingItemName(updates.name)
  if (updates.category !== undefined) payload.category = sanitizeCategory(updates.category)
  if (updates.estimated_price !== undefined) {
    payload.estimated_price = validateShoppingAmount(updates.estimated_price, { label: 'preço estimado' })
  }
  if (updates.actual_price !== undefined) {
    payload.actual_price = updates.actual_price == null
      ? null
      : validateShoppingAmount(updates.actual_price, { allowZero: true, label: 'preço real' })
  }
  if (updates.quantity !== undefined) payload.quantity = validateShoppingQuantity(updates.quantity)
  if (updates.is_essential !== undefined) payload.is_essential = Boolean(updates.is_essential)
  if (updates.is_purchased !== undefined) payload.is_purchased = Boolean(updates.is_purchased)
  if (updates.price_variation_pct !== undefined) {
    payload.price_variation_pct = sanitizeVariation(updates.price_variation_pct)
  }

  if (Object.keys(payload).length === 0) throw new Error('Nenhuma alteração válida foi informada.')
  return payload
}

function assertOwnedStoragePath(userId: string, sessionId: string, storagePath: string) {
  const expectedPrefix = `${userId}/${sessionId}/`
  if (!storagePath.startsWith(expectedPrefix) || storagePath.includes('..')) {
    throw new Error('Caminho de cupom inválido.')
  }
}

export const shoppingService = {
  async getCurrentSession() {
    const supabase = createClient()
    const user = await requireUser(supabase)

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

    const { data: existingSession, error } = await supabase
      .from('monthly_shopping_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', firstDayOfMonth)
      .maybeSingle()

    if (error) throw error

    let session = existingSession
    if (!session) {
      const { data: newSession, error: insertError } = await supabase
        .from('monthly_shopping_sessions')
        .insert({
          user_id: user.id,
          month: firstDayOfMonth,
          estimated_total: 0,
          currency_code: 'BRL',
        })
        .select()
        .single()

      if (insertError?.code === '23505') {
        const { data: concurrentSession, error: concurrentError } = await supabase
          .from('monthly_shopping_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', firstDayOfMonth)
          .single()
        if (concurrentError) throw concurrentError
        session = concurrentSession
      } else {
        if (insertError) throw insertError
        session = newSession
      }
    }

    return session
  },

  async updateBudget(sessionId: string, newBudget: number) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)
    const budget = validateShoppingAmount(newBudget, { label: 'orçamento' })

    const { data, error } = await supabase
      .from('monthly_shopping_sessions')
      .update({ estimated_total: budget })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getItems(sessionId: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async addItem(itemData: NewShoppingItem) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, itemData.session_id)
    const payload = buildNewItemPayload(itemData)

    const { data, error } = await supabase
      .from('shopping_items')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateItem(itemId: string, updates: ShoppingItemUpdates) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    const sessionId = await requireOwnedItem(supabase, user.id, itemId)
    const payload = buildItemUpdates(updates)

    const { data, error } = await supabase
      .from('shopping_items')
      .update(payload)
      .eq('id', itemId)
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteItem(itemId: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    const sessionId = await requireOwnedItem(supabase, user.id, itemId)
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)
      .eq('session_id', sessionId)

    if (error) throw error
  },

  async uploadReceiptImage(file: File, sessionId: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)

    if (!isAllowedOcrImageType(file.type) || file.size <= 0 || file.size > MAX_OCR_FILE_SIZE) {
      throw new Error('Envie uma imagem JPG, PNG ou WEBP de até 5 MB.')
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    validateOcrImagePayload(file.type, file.size, bytes)

    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
    const storagePath = `${user.id}/${sessionId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from('receipts')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (error) throw error
    return storagePath
  },

  async removeReceiptImage(sessionId: string, storagePath: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)
    assertOwnedStoragePath(user.id, sessionId, storagePath)

    const { error } = await supabase.storage.from('receipts').remove([storagePath])
    if (error) throw error
  },

  async saveReceiptRecord(
    sessionId: string,
    storagePath: string,
    extractedTotal: number,
    ocrConfidence: number,
  ) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)
    assertOwnedStoragePath(user.id, sessionId, storagePath)

    const total = validateShoppingAmount(extractedTotal, { label: 'total do cupom' })
    const confidence = Number(ocrConfidence)
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error('Confiança do OCR inválida.')
    }

    const { data, error } = await supabase
      .from('shopping_receipts')
      .insert({
        session_id: sessionId,
        storage_path: storagePath,
        extracted_total: total,
        extracted_date: new Date().toISOString().split('T')[0],
        ocr_confidence: Number(confidence.toFixed(4)),
        processing_status: 'reviewed',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getReceipts(sessionId: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)
    await requireOwnedSession(supabase, user.id, sessionId)
    const { data, error } = await supabase
      .from('shopping_receipts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data) return []

    return Promise.all(data.map(async (receipt: {
      id: string
      storage_path?: string | null
      image_url?: string | null
      extracted_total: number
      created_at: string
    }) => {
      if (!receipt.storage_path) return receipt

      const { data: signed, error: signedError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receipt.storage_path, 300)

      if (signedError) throw signedError
      return { ...receipt, image_url: signed.signedUrl }
    }))
  },

  async deleteReceipt(receiptId: string) {
    const supabase = createClient()
    const user = await requireUser(supabase)

    const { data: receipt, error: receiptError } = await supabase
      .from('shopping_receipts')
      .select('session_id, storage_path, image_url')
      .eq('id', receiptId)
      .maybeSingle()

    if (receiptError) throw receiptError
    if (!receipt) throw new Error('Cupom não encontrado')
    await requireOwnedSession(supabase, user.id, receipt.session_id)

    const storagePath = receipt.storage_path || receipt.image_url?.split('/receipts/').pop() || null
    if (storagePath) assertOwnedStoragePath(user.id, receipt.session_id, storagePath)

    const { error } = await supabase
      .from('shopping_receipts')
      .delete()
      .eq('id', receiptId)
      .eq('session_id', receipt.session_id)

    if (error) throw error

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from('receipts').remove([storagePath])
      if (storageError) console.warn('Falha ao limpar arquivo de cupom após remover o registro.')
    }
  },
}
