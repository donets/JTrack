import { defineStore } from 'pinia'
import type {
  CreateUserInput,
  InviteResponse,
  RoleKey,
  User,
  UserLocationStatus
} from '@jtrack/shared'

export type TeamMember = User & {
  role: RoleKey
  membershipStatus: UserLocationStatus
}

export type InviteMemberPayload = {
  email: string
  name: string
  role: RoleKey
}

interface TeamState {
  members: TeamMember[]
  loading: boolean
  error: string | null
}

export const useTeamStore = defineStore('team', {
  state: (): TeamState => ({
    members: [],
    loading: false,
    error: null
  }),
  getters: {
    activeMemberCount: (state) =>
      state.members.filter((member) => member.membershipStatus === 'active').length,

    membersByRole: (state) => ({
      Owner: state.members.filter((member) => member.role === 'Owner'),
      Manager: state.members.filter((member) => member.role === 'Manager'),
      Technician: state.members.filter((member) => member.role === 'Technician')
    })
  },
  actions: {
    clearError() {
      this.error = null
    },

    async fetchMembers() {
      const api = useApiClient()
      this.loading = true
      this.error = null

      try {
        const members = await api.get<TeamMember[]>('/users')
        this.members = members
        return members
      } catch (error: any) {
        this.error = error?.data?.message ?? error?.message ?? 'Failed to load team members'
        throw error
      } finally {
        this.loading = false
      }
    },

    async inviteMember(payload: InviteMemberPayload) {
      const api = useApiClient()
      this.error = null

      try {
        const response = await api.post<InviteResponse, InviteMemberPayload>('/users/invite', payload)
        await this.fetchMembers()
        return response
      } catch (error: any) {
        this.error = error?.data?.message ?? error?.message ?? 'Failed to send invite'
        throw error
      }
    },

    async updateMemberRole(userId: string, role: RoleKey) {
      const api = useApiClient()
      const locationStore = useLocationStore()
      const member = this.members.find((item) => item.id === userId)

      if (!member) {
        throw new Error('Team member not found')
      }

      if (!locationStore.activeLocationId) {
        throw new Error('Active location is required')
      }

      this.error = null

      const input: CreateUserInput = {
        email: member.email,
        name: member.name,
        role,
        locationId: locationStore.activeLocationId
      }

      try {
        await api.post<User, CreateUserInput>('/users', input)
        await this.fetchMembers()
      } catch (error: any) {
        this.error = error?.data?.message ?? error?.message ?? 'Failed to update member role'
        throw error
      }
    }
  }
})
