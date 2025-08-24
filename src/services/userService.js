import { supabase } from '@/lib/supabase'

export const userService = {
  formatRole(role) {
    const roleMap = {
      nurse: 'Registered Nurse',
      nursing_student: 'Nursing Student',
      nursing_educator: 'Nursing Educator',
      other: 'Other',
    }
    return roleMap[role] || role || 'User'
  },

  async getUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, middle_name, last_name, role, organization')
      .eq('id', user.id)
      .single()

    if (error) {
      console.warn('Profile not found, using email as fallback')
      return {
        full_name: user.email,
        role: 'User',
        organization: 'Not specified',
      }
    }

    const fullNameParts = [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
    ].filter(Boolean) 

    const fullName =
      fullNameParts.length > 0 ? fullNameParts.join(' ') : user.email 

    return {
      full_name: fullName,
      role: this.formatRole(profile.role), 
      organization: profile.organization || 'Not specified',
    }
  },

  async updateUserProfile(profileData) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        middle_name: profileData.middle_name,
        last_name: profileData.last_name,
        organization: profileData.organization,
        role: profileData.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createUserProfile(profileData) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          first_name: profileData.first_name,
          middle_name: profileData.middle_name,
          last_name: profileData.last_name,
          organization: profileData.organization,
          role: profileData.role,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },
}
