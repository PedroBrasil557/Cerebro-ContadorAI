// src/services/shoppingService.ts
import { createClient } from '@/lib/supabase/client'

export const shoppingService = {
  // ============================================================================
  // 🛒 GESTÃO DE SESSÕES
  // ============================================================================
  
  // Puxa a sessão do mês atual ou cria uma nova
  async getCurrentSession() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

    let { data: session, error } = await supabase
      .from('monthly_shopping_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', firstDayOfMonth)
      .single()

    if (!session || error) {
      const { data: newSession, error: insertError } = await supabase
        .from('monthly_shopping_sessions')
        .insert({ 
            user_id: user.id, 
            month: firstDayOfMonth, 
            estimated_total: 1500,
            currency_code: 'BRL'
        })
        .select()
        .single()
        
      if (insertError) throw insertError
      session = newSession
    }

    return session
  },

  // Atualiza o orçamento do mês
  async updateBudget(sessionId: string, newBudget: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from('monthly_shopping_sessions')
      .update({ estimated_total: newBudget })
      .eq('id', sessionId)
      
    if (error) throw error
  },

  // ============================================================================
  // 📦 GESTÃO DE ITENS
  // ============================================================================

  // Puxa todos os itens da lista
  async getItems(sessionId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data
  },

  // Adiciona novo item
  async addItem(itemData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shopping_items')
      .insert(itemData)
      .select()
      .single()
      
    if (error) throw error
    return data
  },

  // Atualiza um item (nome, preço, status de compra)
  async updateItem(itemId: string, updates: any) {
    const supabase = createClient()
    const { error } = await supabase
      .from('shopping_items')
      .update(updates)
      .eq('id', itemId)
      
    if (error) throw error
  },

  // Deleta um item
  async deleteItem(itemId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)
      
    if (error) throw error
  },

  // ============================================================================
  // 📁 ARQUIVO FISCAL (CUPONS E IMAGENS)
  // ============================================================================

  // Faz o upload da imagem para o Supabase Storage (Bucket: 'receipts')
  async uploadReceiptImage(file: File, sessionId: string) {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${sessionId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file)

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    return publicUrlData.publicUrl
  },

  // Salva o registro do cupom no banco de dados
  async saveReceiptRecord(sessionId: string, imageUrl: string, extractedTotal: number = 0) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shopping_receipts')
      .insert({
        session_id: sessionId,
        image_url: imageUrl,
        extracted_total: extractedTotal,
        extracted_date: new Date().toISOString().split('T')[0],
        processing_status: 'processed'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Puxa todos os cupons salvos
  async getReceipts(sessionId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shopping_receipts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // ✅ NOVA: Deleta o registro do cupom e remove o arquivo físico do Storage
  async deleteReceipt(receiptId: string) {
    const supabase = createClient()
    
    // 1. Busca a URL da imagem para saber qual arquivo deletar no storage
    const { data: receipt } = await supabase
      .from('shopping_receipts')
      .select('image_url')
      .eq('id', receiptId)
      .single()

    if (receipt?.image_url) {
        // Extrai o caminho do arquivo da URL (tudo que vem depois de /receipts/)
        const path = receipt.image_url.split('/receipts/').pop()
        if (path) {
            await supabase.storage.from('receipts').remove([path])
        }
    }

    // 2. Deleta o registro na tabela
    const { error } = await supabase
      .from('shopping_receipts')
      .delete()
      .eq('id', receiptId)
      
    if (error) throw error
  }
}