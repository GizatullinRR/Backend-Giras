import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly refreshExpiresDays: number;
  private readonly refreshCookieSecure: boolean;
  private readonly accessCookieSecure: boolean;
  private readonly accessCookieMaxAgeMs: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiresDays = this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS', 30);
    this.refreshCookieSecure =
      this.configService.get<string>('REFRESH_COOKIE_SECURE', 'false') === 'true';
    this.accessCookieSecure =
      this.configService.get<string>('ACCESS_COOKIE_SECURE', `${this.refreshCookieSecure}`) ===
      'true';
    this.accessCookieMaxAgeMs = this.parseDurationToMs(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      15 * 60 * 1000,
    );
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@CurrentUser() user: { id: string; role: string }) {
    return this.authService.getMe(user.id);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const tokens = await this.authService.register(dto);
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ ok: true });
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const tokens = await this.authService.login(dto);
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ ok: true });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Refresh token не найден',
      });
    }

    const tokens = await this.authService.refresh(refreshToken);
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ ok: true });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearAuthCookies(res);
    return res.json({ message: 'Выход выполнен успешно' });
  }

  private setAccessCookie(res: Response, token: string) {
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: this.accessCookieSecure,
      sameSite: 'lax',
      maxAge: this.accessCookieMaxAgeMs,
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.refreshCookieSecure,
      sameSite: 'lax',
      maxAge: this.refreshExpiresDays * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: this.accessCookieSecure,
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.refreshCookieSecure,
      sameSite: 'lax',
    });
  }

  private parseDurationToMs(rawValue: string, fallback: number): number {
    const value = rawValue.trim().toLowerCase();
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(amount) || amount <= 0) {
      return fallback;
    }

    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * (multipliers[unit] ?? 1);
  }
}
