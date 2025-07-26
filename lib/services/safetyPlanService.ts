import { supabase } from '../supabase/supabaseClient'

// Types
export interface SafetyPlan {
  id: number
  user_id: string
  created_at: string
  updated_at: string
  last_reviewed_at: string
  is_shared_with_therapist: boolean
  therapist_email: string | null
  notes: string | null
}

export interface SafetyPlanSection {
  id: string
  title: string
  description: string
  icon_name: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SafetyPlanItem {
  id: number
  user_id: string
  section_id: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
  
  // Joined data from sections
  section?: SafetyPlanSection
}

export interface SafetyPlanContact {
  id: number
  user_id: string
  name: string
  relationship: string | null
  phone: string
  email: string | null
  available_hours: string | null
  is_emergency_contact: boolean
  is_professional: boolean
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateSafetyPlanItem {
  section_id: string
  content: string
  sort_order?: number
}

export interface CreateSafetyPlanContact {
  name: string
  relationship?: string | null
  phone: string
  email?: string | null
  available_hours?: string | null
  is_emergency_contact?: boolean
  is_professional?: boolean
  notes?: string | null
  sort_order?: number
}

export interface SafetyPlanSummary {
  plan_id: number
  total_items: number
  total_contacts: number
  warning_signs_count: number
  coping_strategies_count: number
  safe_places_count: number
  reasons_to_live_count: number
  emergency_contacts_count: number
  last_reviewed_at: string
  completeness_status: 'Complete' | 'Partial' | 'Incomplete'
  completeness_score: number
}

export interface SafetyPlanWithItems {
  plan: SafetyPlan
  sections: SafetyPlanSection[]
  items: { [sectionId: string]: SafetyPlanItem[] }
  contacts: SafetyPlanContact[]
}

export class SafetyPlanService {
  // Get all safety plan sections
  static async getSafetyPlanSections(): Promise<{ data: SafetyPlanSection[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      return { data, error }
    } catch (error) {
      console.error('Error fetching safety plan sections:', error)
      return { data: null, error }
    }
  }

  // Get or create user's safety plan
  static async getOrCreateSafetyPlan(userId: string): Promise<{ data: SafetyPlan | null; error: any }> {
    try {
      // First, try to get existing safety plan
      let { data: existingPlan, error: fetchError } = await supabase
        .from('safety_plans')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        return { data: null, error: fetchError }
      }

      if (existingPlan) {
        return { data: existingPlan, error: null }
      }

      // Create new safety plan if none exists
      const { data: newPlan, error: createError } = await supabase
        .from('safety_plans')
        .insert({ user_id: userId })
        .select()
        .single()

      return { data: newPlan, error: createError }
    } catch (error) {
      console.error('Error getting or creating safety plan:', error)
      return { data: null, error }
    }
  }

  // Get complete safety plan with all items and contacts
  static async getCompleteSafetyPlan(userId: string): Promise<{ data: SafetyPlanWithItems | null; error: any }> {
    try {
      // Get or create the safety plan
      const { data: plan, error: planError } = await this.getOrCreateSafetyPlan(userId)
      if (planError || !plan) {
        return { data: null, error: planError }
      }

      // Get all data in parallel
      const [sectionsResult, itemsResult, contactsResult] = await Promise.all([
        this.getSafetyPlanSections(),
        this.getSafetyPlanItems(userId),
        this.getSafetyPlanContacts(userId)
      ])

      if (sectionsResult.error) {
        return { data: null, error: sectionsResult.error }
      }
      if (itemsResult.error) {
        return { data: null, error: itemsResult.error }
      }
      if (contactsResult.error) {
        return { data: null, error: contactsResult.error }
      }

      // Group items by section
      const itemsBySection: { [sectionId: string]: SafetyPlanItem[] } = {}
      sectionsResult.data?.forEach(section => {
        itemsBySection[section.id] = itemsResult.data?.filter(item => item.section_id === section.id) || []
      })

      return {
        data: {
          plan,
          sections: sectionsResult.data || [],
          items: itemsBySection,
          contacts: contactsResult.data || []
        },
        error: null
      }
    } catch (error) {
      console.error('Error fetching complete safety plan:', error)
      return { data: null, error }
    }
  }

  // Get safety plan items for a user
  static async getSafetyPlanItems(userId: string): Promise<{ data: SafetyPlanItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_items')
        .select(`
          *,
          section:safety_plan_sections(*)
        `)
        .eq('user_id', userId)
        .order('section_id')
        .order('sort_order')

      return { data, error }
    } catch (error) {
      console.error('Error fetching safety plan items:', error)
      return { data: null, error }
    }
  }

  // Create a new safety plan item
  static async createSafetyPlanItem(userId: string, item: CreateSafetyPlanItem): Promise<{ data: SafetyPlanItem | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_items')
        .insert({
          user_id: userId,
          ...item
        })
        .select(`
          *,
          section:safety_plan_sections(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating safety plan item:', error)
      return { data: null, error }
    }
  }

  // Update a safety plan item
  static async updateSafetyPlanItem(itemId: number, updates: Partial<CreateSafetyPlanItem>): Promise<{ data: SafetyPlanItem | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_items')
        .update(updates)
        .eq('id', itemId)
        .select(`
          *,
          section:safety_plan_sections(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating safety plan item:', error)
      return { data: null, error }
    }
  }

  // Delete a safety plan item
  static async deleteSafetyPlanItem(itemId: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('safety_plan_items')
        .delete()
        .eq('id', itemId)

      return { error }
    } catch (error) {
      console.error('Error deleting safety plan item:', error)
      return { error }
    }
  }

  // Get safety plan contacts for a user
  static async getSafetyPlanContacts(userId: string): Promise<{ data: SafetyPlanContact[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_emergency_contact', { ascending: false })
        .order('sort_order')

      return { data, error }
    } catch (error) {
      console.error('Error fetching safety plan contacts:', error)
      return { data: null, error }
    }
  }

  // Create a new safety plan contact
  static async createSafetyPlanContact(userId: string, contact: CreateSafetyPlanContact): Promise<{ data: SafetyPlanContact | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_contacts')
        .insert({
          user_id: userId,
          ...contact
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating safety plan contact:', error)
      return { data: null, error }
    }
  }

  // Update a safety plan contact
  static async updateSafetyPlanContact(contactId: number, updates: Partial<CreateSafetyPlanContact>): Promise<{ data: SafetyPlanContact | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plan_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating safety plan contact:', error)
      return { data: null, error }
    }
  }

  // Delete a safety plan contact
  static async deleteSafetyPlanContact(contactId: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('safety_plan_contacts')
        .delete()
        .eq('id', contactId)

      return { error }
    } catch (error) {
      console.error('Error deleting safety plan contact:', error)
      return { error }
    }
  }

  // Update safety plan metadata (notes, sharing status, etc.)
  static async updateSafetyPlan(userId: string, updates: Partial<{
    notes: string | null
    is_shared_with_therapist: boolean
    therapist_email: string | null
    last_reviewed_at: string
  }>): Promise<{ data: SafetyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('safety_plans')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating safety plan:', error)
      return { data: null, error }
    }
  }

  // Mark safety plan as reviewed
  static async markAsReviewed(userId: string): Promise<{ error: any }> {
    return this.updateSafetyPlan(userId, { 
      last_reviewed_at: new Date().toISOString() 
    })
  }

  // Get safety plan summary/analytics
  static async getSafetyPlanSummary(userId: string): Promise<{ data: SafetyPlanSummary | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('complete_safety_plans')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Get completeness data
      const { data: completenessData, error: completenessError } = await supabase
        .from('safety_plan_completeness')
        .select('*')
        .eq('user_id', userId)
        .single()

      const summary: SafetyPlanSummary = {
        plan_id: data.plan_id,
        total_items: data.total_items,
        total_contacts: data.total_contacts,
        warning_signs_count: data.warning_signs_count,
        coping_strategies_count: data.coping_strategies_count,
        safe_places_count: data.safe_places_count,
        reasons_to_live_count: data.reasons_to_live_count,
        emergency_contacts_count: data.emergency_contacts_count,
        last_reviewed_at: data.last_reviewed_at,
        completeness_status: completenessData?.completeness_status || 'Incomplete',
        completeness_score: completenessData?.completeness_score || 0
      }

      return { data: summary, error: null }
    } catch (error) {
      console.error('Error fetching safety plan summary:', error)
      return { data: null, error }
    }
  }

  // Generate safety plan export data
  static async generateSafetyPlanExport(userId: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data: safetyPlan, error } = await this.getCompleteSafetyPlan(userId)
      
      if (error || !safetyPlan) {
        return { data: null, error }
      }

      const emergencyResources = [
        { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
        { name: 'Emergency Services', number: '911', available: '24/7' }
      ]

      const content = `
PERSONAL SAFETY PLAN
Generated on: ${new Date().toLocaleDateString()}

EMERGENCY RESOURCES:
${emergencyResources.map(r => `${r.name}: ${r.number} (${r.available})`).join('\n')}

${safetyPlan.sections.map(section => `
${section.title.toUpperCase()}
${section.description}
${safetyPlan.items[section.id]?.map((item, i) => `${i + 1}. ${item.content}`).join('\n') || 'No items added yet'}
`).join('\n')}

SUPPORT CONTACTS:
${safetyPlan.contacts.map(c => `${c.name} (${c.relationship || 'Contact'}): ${c.phone}${c.available_hours ? ' - ' + c.available_hours : ''}`).join('\n')}

Last updated: ${new Date(safetyPlan.plan.updated_at).toLocaleDateString()}
Last reviewed: ${new Date(safetyPlan.plan.last_reviewed_at).toLocaleDateString()}
      `.trim()

      return { data: content, error: null }
    } catch (error) {
      console.error('Error generating safety plan export:', error)
      return { data: null, error }
    }
  }

  // Create sample safety plan for testing
  static async createSampleSafetyPlan(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .rpc('create_sample_safety_plan', { user_uuid: userId })

      return { error }
    } catch (error) {
      console.error('Error creating sample safety plan:', error)
      return { error }
    }
  }

  // Helper function to format relative time
  static formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    
    return past.toLocaleDateString()
  }
} 