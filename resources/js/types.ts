export interface Country {
    id: number;
    code: 'AR' | 'CO';
    name: string;
    currency: string;
    min_amount: number;
    max_amount: number;
    starting_limit: number | null;
    limit_increase_pct: number;
    min_term: number;
    max_term: number;
    is_active: boolean;
}

/** Internal credit score and borrowing limit (app/Support/CreditProfile.php). */
export interface CreditSummary {
    score: number | null;
    label: 'excellent' | 'good' | 'fair' | 'poor' | 'new';
    good: boolean;
    currency: string | null;
    limit: number | null;
    next_limit: number | null;
    start: number | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'borrower' | 'staff' | 'admin';
    country: string | null;
    phone?: string | null;
    is_active?: boolean;
}

export interface SharedProps {
    app: { name: string; whatsapp: string | null; phone: string | null; email: string };
    locale: 'es' | 'en';
    auth: { user: User | null; can_apply: boolean; unread_chats: number };
    flash: { success: string | null; error: string | null };
    countries: Country[];
    errors: Record<string, string>;
    [key: string]: unknown;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Document {
    id: number;
    type: 'id_front' | 'id_back' | 'address_proof' | 'income_proof' | 'other';
    original_name: string;
    mime: string;
    size: number;
}

export type Frequency = 'daily' | 'weekly' | 'fortnightly';
export type LoanType = 'personal' | 'emergency' | 'debt_consolidation' | 'education' | 'medical' | 'home_improvement' | 'vehicle';

export interface Application {
    id: number;
    reference: string;
    user_id: number;
    user?: User;
    country: string;
    currency: string;
    // 4. Loan details
    loan_type: LoanType;
    amount: number;
    term_months: number;
    repayment_frequency: Frequency;
    purpose: string;
    // 1. Personal
    full_name: string;
    date_of_birth: string;
    gender: string | null;
    marital_status: string | null;
    email: string;
    phone: string;
    address: string;
    city: string;
    // 2. Employment
    employment_status: 'employed' | 'self_employed' | 'casual' | 'unemployed';
    employer_name: string | null;
    occupation: string | null;
    employment_length: string | null;
    // 3. Financial
    monthly_income: number;
    other_income: number;
    other_income_source: string | null;
    monthly_expenses: number;
    existing_debts: number;
    other_commitments: string | null;
    // 5. Identification (id_number only sent to staff)
    id_type: 'national_id' | 'drivers_licence' | 'passport';
    id_number?: string;
    id_issuing_country: string;
    id_expiry: string | null;
    // 6. Banking (account_number only sent to staff; borrowers get the masked one)
    disbursement_method: 'bank' | 'cash_pickup';
    bank_name: string | null;
    account_holder: string | null;
    account_type: 'savings' | 'checking' | null;
    account_number?: string;
    account_number_masked?: string;
    // 7. Consents
    consent_privacy: boolean;
    consent_data_use: boolean;
    consent_credit_check: boolean;
    declaration_accurate: boolean;
    consented_at: string | null;
    notes: string | null;
    status: ApplicationStatus;
    interest_rate: number | null;
    admin_notes: string | null;
    reviewer?: { id: number; name: string } | null;
    reviewed_at: string | null;
    created_at: string;
    documents?: Document[];
    loan?: { id: number; reference?: string } | null;
}

export interface Installment {
    id: number;
    number: number;
    due_date: string;
    principal: number;
    interest: number;
    amount_due: number;
    amount_paid: number;
    paid_at: string | null;
    reminded_on?: string | null;
    status: 'paid' | 'overdue' | 'partial' | 'upcoming';
}

export interface Payment {
    id: number;
    amount: number;
    paid_on: string;
    method: string;
    reference: string | null;
    recorder?: { id: number; name: string } | null;
}

export interface Loan {
    id: number;
    reference: string;
    user?: User;
    application?: { id: number; reference: string; disbursement_method?: 'bank' | 'cash_pickup' };
    country: string;
    currency: string;
    principal: number;
    interest_rate: number;
    term_months: number;
    repayment_frequency: Frequency;
    installment_count: number;
    installment_amount: number;
    total_payable: number;
    amount_paid: number;
    status: 'active' | 'paid' | 'defaulted';
    disbursed_at: string;
    installments?: Installment[];
    payments?: Payment[];
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
