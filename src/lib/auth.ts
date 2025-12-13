import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export type UserRole = 'admin' | 'partner' | 'lawyer' | 'intern' | 'financial' | 'support' | 'client'

export interface User {
    id: string
    email: string
    fullName: string
    role: UserRole
    tenantId: string
    isActive: boolean
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            console.error('[AUTH] user_not_found', { email })
            return null
        }

        if (!user.isActive) {
            console.error('[AUTH] user_inactive', { email })
            return null
        }

        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
            console.error('[AUTH] invalid_password', { email })
            return null
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role as UserRole,
            tenantId: user.tenantId,
            isActive: user.isActive,
        }
    } catch (error) {
        console.error('[AUTH] error_authenticate_user', { email, error })
        return null
    }
}

/**
 * Get user by ID
 */ export async function getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user || !user.isActive) {
        return null
    }

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as UserRole,
        tenantId: user.tenantId,
        isActive: user.isActive,
    }
}

/**
 * Get user's tenant ID
 */
export async function getUserTenantId(userId: string): Promise<string | null> {
    const user = await getUserById(userId)
    return user?.tenantId || null
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User, role: UserRole | UserRole[]): boolean {
    if (Array.isArray(role)) {
        return role.includes(user.role)
    }
    return user.role === role
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
    return hasRole(user, 'admin')
}
