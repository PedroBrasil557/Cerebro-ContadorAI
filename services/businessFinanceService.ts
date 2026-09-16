import { createClient } from '@/lib/supabase/client'
import type {
  BusinessCatalogItem,
  BusinessCostItem,
  BusinessCustomer,
  BusinessWorkspace,
  BusinessWorkspaceCapability,
  BusinessSettings,
  NewTransaction,
  Transaction,
} from '@/types_db'

const supabase = createClient()

async function workspace(): Promise<BusinessWorkspace> {
  const response = await fetch('/api/business/workspace', { cache: 'no-store' })
  const result = await response.json() as { workspace?: BusinessWorkspace; error?: { message?: string } }
  if (!response.ok || !result.workspace) {
    throw new Error(result.error?.message ?? 'Não foi possível carregar o ambiente profissional.')
  }
  return result.workspace
}

async function authenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Faça login para continuar.')
  return user.id
}

export const businessFinanceService = {
  getWorkspace: workspace,

  async getDashboardData() {
    const currentWorkspace = await workspace()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const [transactions, capabilities, customers, catalog, costs, settings] = await Promise.all([
      supabase.from('transactions').select('*').eq('workspace_id', currentWorkspace.id).eq('scope', 'business').gte('date', startOfMonth).order('date', { ascending: false }),
      supabase.from('business_workspace_capabilities').select('*').eq('workspace_id', currentWorkspace.id),
      supabase.from('business_customers').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('business_catalog_items').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('business_cost_items').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('business_settings').select('*').eq('workspace_id', currentWorkspace.id).maybeSingle(),
    ])
    const failure = [transactions, capabilities, customers, catalog, costs, settings].find((result) => result.error)
    if (failure?.error) throw failure.error

    return {
      workspace: currentWorkspace,
      transactions: (transactions.data ?? []) as Transaction[],
      capabilities: (capabilities.data ?? []) as BusinessWorkspaceCapability[],
      customers: (customers.data ?? []) as BusinessCustomer[],
      catalog: (catalog.data ?? []) as BusinessCatalogItem[],
      costs: (costs.data ?? []) as BusinessCostItem[],
      settings: settings.data as BusinessSettings | null,
    }
  },

  async createTransaction(input: Partial<NewTransaction>) {
    const [currentWorkspace, userId] = await Promise.all([workspace(), authenticatedUserId()])
    const payload = {
      user_id: userId,
      workspace_id: currentWorkspace.id,
      description: input.description,
      amount: Number(input.amount),
      type: input.type,
      scope: 'business',
      category: input.category || 'Geral',
      date: input.date || new Date().toISOString(),
      status: input.status || 'concluido',
      is_paid: input.is_paid ?? true,
      is_fixed: input.is_fixed ?? false,
      source: input.source || 'Manual',
    }
    const { data, error } = await supabase.from('transactions').insert(payload).select().single()
    if (error) throw error
    return data as Transaction
  },

  async createCustomer(input: Pick<BusinessCustomer, 'name'> & Partial<BusinessCustomer>) {
    const [currentWorkspace, userId] = await Promise.all([workspace(), authenticatedUserId()])
    const { data, error } = await supabase.from('business_customers').insert({
      workspace_id: currentWorkspace.id,
      created_by: userId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      notes: input.notes || null,
      customer_type: input.customer_type || 'person',
    }).select().single()
    if (error) throw error
    return data as BusinessCustomer
  },

  async deleteCustomer(id: string) {
    const currentWorkspace = await workspace()
    const { error } = await supabase.from('business_customers').delete().eq('id', id).eq('workspace_id', currentWorkspace.id)
    if (error) throw error
  },

  async createCostItem(input: Pick<BusinessCostItem, 'name' | 'purchase_price'> & Partial<BusinessCostItem>) {
    const currentWorkspace = await workspace()
    const { data, error } = await supabase.from('business_cost_items').insert({
      workspace_id: currentWorkspace.id,
      name: input.name,
      category: input.category || 'Geral',
      purchase_price: Number(input.purchase_price),
      quantity: input.quantity ?? null,
      estimated_yield: input.estimated_yield ?? null,
    }).select().single()
    if (error) throw error
    return data as BusinessCostItem
  },

  async deleteCostItem(id: string) {
    const currentWorkspace = await workspace()
    const { error } = await supabase.from('business_cost_items').delete().eq('id', id).eq('workspace_id', currentWorkspace.id)
    if (error) throw error
  },
}
