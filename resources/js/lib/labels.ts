// English labels (translation keys) for the application's enum values; wrap each in t() when rendering.

export const DISBURSEMENT_LABEL: Record<string, string> = { bank: 'Bank transfer', cash_pickup: 'Cash pick-up' };

export const LOAN_TYPE_LABEL: Record<string, string> = {
    personal: 'Personal loan',
    emergency: 'Emergency',
    debt_consolidation: 'Debt consolidation',
    education: 'Education',
    medical: 'Medical expenses',
    home_improvement: 'Home improvement',
    vehicle: 'Vehicle',
};

export const EMPLOYMENT_LABEL: Record<string, string> = {
    employed: 'Employed',
    self_employed: 'Self-employed',
    casual: 'Casual',
    unemployed: 'Unemployed',
};

export const ID_TYPE_LABEL: Record<string, string> = {
    national_id: 'National ID (DNI / Cédula)',
    drivers_licence: "Driver's licence",
    passport: 'Passport',
};

export const GENDER_LABEL: Record<string, string> = {
    female: 'Female',
    male: 'Male',
    non_binary: 'Non-binary',
    prefer_not: 'Prefer not to say',
};

export const MARITAL_LABEL: Record<string, string> = {
    single: 'Single',
    married: 'Married',
    de_facto: 'De facto / living together',
    divorced: 'Divorced',
    widowed: 'Widowed',
};

export const ACCOUNT_TYPE_LABEL: Record<string, string> = { savings: 'Savings account', checking: 'Checking account' };

export const DOC_LABEL: Record<string, string> = {
    id_front: 'ID — front',
    id_back: 'ID — back',
    address_proof: 'Proof of address',
    income_proof: 'Proof of income',
    other: 'Other document',
};

/** ISO-2 countries offered for the ID's issuing country. */
export const ID_COUNTRIES: Record<string, string> = {
    AR: 'Argentina', CO: 'Colombia', VE: 'Venezuela', PE: 'Peru', EC: 'Ecuador', BO: 'Bolivia', BR: 'Brazil',
    CL: 'Chile', PY: 'Paraguay', UY: 'Uruguay', MX: 'Mexico', ES: 'Spain', US: 'United States',
};
