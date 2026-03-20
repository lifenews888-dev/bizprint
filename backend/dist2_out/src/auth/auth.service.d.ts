import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            full_name: string;
            role: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            full_name: string;
            role: string;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
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
    }>;
    private generateToken;
}
