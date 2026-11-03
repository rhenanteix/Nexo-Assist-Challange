import { Body, Controller, Injectable, Post, UnauthorizedException, CanActivate, ExecutionContext, UseGuards, Get, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { compare } from 'bcryptjs';
export class LoginDto {
    @IsEmail()
    email!: string;
    @IsString()
    @MinLength(1)
    password!: string;
}
export type Principal = {
    sub: string;
    role: string;
    email: string;
};
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): Principal => ctx.switchToHttp().getRequest().user);
@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private jwt: JwtService) { }
    async canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest();
        const token = String(req.headers.authorization || '').replace(/^Bearer /i, '');
        try {
            req.user = await this.jwt.verifyAsync<Principal>(token);
            return true;
        }
        catch {
            throw new UnauthorizedException('Sessão inválida ou expirada');
        }
    }
}
@Injectable()
export class AuthService {
    constructor(private db: PrismaService, private jwt: JwtService) { }
    async login(dto: LoginDto) {
        const user = await this.db.user.findUnique({ where: { email: dto.email.toLowerCase() } });
        if (!user || (user.passwordHash && !(await compare(dto.password, user.passwordHash))))
            throw new UnauthorizedException('Credenciais inválidas');
        // Demo users without a password hash accept any nonempty password, per PRD.
        const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
        return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }
}
@Controller('auth')
export class AuthController {
    constructor(private service: AuthService) { }
    @Post('login')
    login(
    @Body()
    dto: LoginDto) { return this.service.login(dto); }
    @UseGuards(JwtGuard)
    @Get('me')
    me(
    @CurrentUser()
    user: Principal) { return user; }
}
