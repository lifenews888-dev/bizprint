export declare class User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone: string;
    company_name: string;
    register_number: string;
    avatar_url: string;
    preferred_lang: string;
    role: string;
    totp_enabled: boolean;
    totp_secret: string;
    is_verified: boolean;
    is_active: boolean;
    last_login_at: Date;
    created_at: Date;
    bank_name: string;
    bank_account: string;
    bank_account_name: string;
    updated_at: Date;
}
