import { defineStore } from 'pinia'
import type {
  InviteResponse,
  RoleKey,
  UpdateUserInput,
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

type UpdateMemberAccessPayload = {
  role?: RoleKey
  membershipStatus?: UserLocationStatus
}

interface TeamState {
  members: TeamMember[]
  loading: boolean
  error: string | null
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      data?: {
        message?: string
      }
      message?: string
    }

    return apiError.data?.message ?? apiError.message ?? fallback
  }

  return fallback
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
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to load team members')
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
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to send invite')
        throw error
      }
    },

    async updateMemberAccess(userId: string, payload: UpdateMemberAccessPayload) {
      const api = useApiClient()
      const member = this.members.find((item) => item.id === userId)

      if (!member) {
        throw new Error('Team member not found')
      }

      this.error = null

      const input: UpdateUserInput = payload

      try {
        await api.patch<User, UpdateUserInput>(`/users/${userId}`, input)
        await this.fetchMembers()
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to update member access')
        throw error
      }
    },

    async updateMemberRole(userId: string, role: RoleKey) {
      try {
        await this.updateMemberAccess(userId, { role })
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to update member role')
        throw error
      }
    },

    async updateMemberStatus(userId: string, membershipStatus: UserLocationStatus) {
      try {
        await this.updateMemberAccess(userId, { membershipStatus })
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to update member status')
        throw error
      }
    },

    async removeMember(userId: string) {
      const api = useApiClient()
      this.error = null

      try {
        await api.delete<{ ok: boolean }>(`/users/${userId}`)
        await this.fetchMembers()
      } catch (error: unknown) {
        this.error = getErrorMessage(error, 'Failed to remove member')
        throw error
      }
    }
  }
})
