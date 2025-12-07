// Database types based on Supabase schema
export type UserRole = 'admin' | 'partner' | 'lawyer' | 'intern' | 'financial' | 'support' | 'client'

export type ClientType = 'pf' | 'pj' // pessoa física | pessoa jurídica
export type ClientStatus = 'lead' | 'active' | 'inactive' | 'archived'

export type MatterStatus = 'open' | 'pending' | 'closed' | 'archived'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
export type HearingStatus = 'scheduled' | 'completed' | 'cancelled'
export type InteractionType = 'call' | 'email' | 'meeting' | 'note'

// Core Schema
export interface Tenant {
    id: string
    name: string
    cnpj: string | null
    email: string | null
    phone: string | null
    settings: Record<string, unknown>
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    tenant_id: string
    full_name: string
    email: string
    role: UserRole
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Role {
    id: string
    tenant_id: string
    name: string
    description: string | null
    permissions: Record<string, unknown>
    created_at: string
}

export interface AuditLog {
    id: string
    tenant_id: string
    user_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

// CRM Schema
export interface Client {
    id: string
    tenant_id: string
    type: ClientType
    name: string
    cpf_cnpj: string | null
    email: string | null
    phone: string | null
    address: Record<string, unknown> | null
    responsible_lawyer_id: string | null
    status: ClientStatus
    leadStage?: string
    tags: string[] | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface Contact {
    id: string
    tenant_id: string
    client_id: string
    name: string
    role: string | null
    email: string | null
    phone: string | null
    is_primary: boolean
    created_at: string
}

export interface Interaction {
    id: string
    tenant_id: string
    client_id: string
    user_id: string | null
    type: InteractionType
    subject: string | null
    description: string | null
    metadata: Record<string, unknown>
    created_at: string
}

// Cases Schema
export interface Matter {
    id: string
    tenant_id: string
    client_id: string
    process_number: string | null
    title: string
    description: string | null
    court: string | null
    district: string | null
    department: string | null
    instance: string | null
    practice_area: string
    responsible_lawyer_id: string | null
    status: MatterStatus
    risk_score: number | null
    tags: string[] | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface Task {
    id: string
    tenant_id: string
    matter_id: string | null
    assigned_to_id: string | null
    title: string
    description: string | null
    due_date: string | null
    priority: TaskPriority
    status: TaskStatus
    completed_at: string | null
    created_at: string
}

export interface Deadline {
    id: string
    tenant_id: string
    matter_id: string
    title: string
    description: string | null
    deadline_date: string
    alert_days_before: number
    is_completed: boolean
    completed_at: string | null
    created_at: string
}

export interface Hearing {
    id: string
    tenant_id: string
    matter_id: string
    hearing_date: string
    type: string | null
    location: string | null
    attendees: string[] | null
    notes: string | null
    status: HearingStatus
    created_at: string
}

export interface Activity {
    id: string
    tenant_id: string
    matter_id: string
    user_id: string | null
    action: string
    description: string | null
    metadata: Record<string, unknown>
    created_at: string
}

// Documents Schema
export interface Document {
    id: string
    tenant_id: string
    matter_id: string | null
    client_id: string | null
    name: string
    description: string | null
    type: string | null
    storage_path: string
    file_size: number | null
    mime_type: string | null
    version: number
    is_template: boolean
    tags: string[] | null
    uploaded_by_id: string | null
    metadata: Record<string, unknown>
    created_at: string
}

export interface DocumentVersion {
    id: string
    tenant_id: string
    document_id: string
    version: number
    storage_path: string
    file_size: number | null
    uploaded_by_id: string | null
    changes_description: string | null
    created_at: string
}

// View models aligned with Prisma includes (camelCase)
export type ClientStatusCamel = 'lead' | 'active' | 'inactive' | 'archived'

export interface ClientView {
    id: string
    type: 'pf' | 'pj'
    name: string
    cpfCnpj?: string | null
    email?: string | null
    phone?: string | null
    street?: string | null
    number?: string | null
    complement?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    status: ClientStatusCamel | string
    createdAt?: string
    responsibleLawyer?: { fullName: string; email?: string } | null
    contacts: Array<{ id: string; name: string; role?: string | null; email?: string | null; phone?: string | null }>
    interactions: Array<{ id: string; subject?: string | null; description?: string | null; createdAt: string; user?: { fullName?: string } | null }>
    matters: Array<{ id: string; title: string; processNumber?: string | null }>
    _count: { matters: number; contacts: number; interactions: number }
}

export interface MatterView {
    id: string
    title: string
    processNumber?: string | null
    practiceArea: string
    status: 'open' | 'pending' | 'closed' | 'archived'
    updatedAt: string
    client: { id: string; name: string }
}

export interface TransactionView {
    id: string
    type: 'revenue' | 'expense'
    category: string
    description: string
    amount: number
    date: string
    status: 'paid' | 'pending'
    invoice?: { invoiceNumber: string; client: { name: string } }
}

export interface InvoiceView {
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    totalAmount: number
    status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
    client: { name: string }
    _count?: { items: number }
}

export interface Template {
    id: string
    tenant_id: string
    name: string
    description: string | null
    category: string | null
    content: string
    variables: unknown[] // Array of variable definitions
    created_by_id: string | null
    created_at: string
    updated_at: string
}

// Billing Schema
export interface TimeEntry {
    id: string
    tenant_id: string
    user_id: string
    matter_id: string | null
    client_id: string | null
    description: string
    hours: number
    hourly_rate: number | null
    billable: boolean
    billed: boolean
    invoice_id: string | null
    date: string
    created_at: string
}

export interface Invoice {
    id: string
    tenant_id: string
    client_id: string
    invoice_number: string
    matter_id: string | null
    issue_date: string
    due_date: string
    subtotal: number
    tax_amount: number
    total_amount: number
    status: InvoiceStatus
    payment_method: string | null
    paid_at: string | null
    notes: string | null
    metadata: Record<string, unknown>
    created_at: string
}

export interface InvoiceItem {
    id: string
    tenant_id: string
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    created_at: string
}

export interface Payment {
    id: string
    tenant_id: string
    invoice_id: string
    amount: number
    payment_method: string
    payment_date: string
    transaction_id: string | null
    notes: string | null
    created_at: string
}

// Form types (for validation)
export interface ClientFormData {
    type: ClientType
    name: string
    cpf_cnpj?: string
    email?: string
    phone?: string
    address?: {
        street?: string
        number?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
        zip_code?: string
    }
    responsible_lawyer_id?: string
    tags?: string[]
}

export interface MatterFormData {
    client_id: string
    process_number?: string
    title: string
    description?: string
    court?: string
    district?: string
    department?: string
    instance?: string
    practice_area: string
    responsible_lawyer_id?: string
    risk_score?: number
    tags?: string[]
}

export interface TimeEntryFormData {
    matter_id?: string
    client_id?: string
    description: string
    hours: number
    hourly_rate?: number
    billable: boolean
    date: string
}

export interface InvoiceFormData {
    client_id: string
    matter_id?: string
    issue_date: string
    due_date: string
    items: {
        description: string
        quantity: number
        unit_price: number
    }[]
    notes?: string
}
