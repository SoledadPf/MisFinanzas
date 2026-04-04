/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true para 465, false para 587
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Crear usuario
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    // Generar token
    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Devolvemos success incluso si no existe por seguridad (prevención de enumeración de usuarios)
      return {
        message: 'Si el correo existe, se ha enviado un código de recuperación',
      };
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // PIN de 6 dígitos
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // Expira en 15 minutos

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    const mailOptions = {
      from: `"MisFinanzas App" <${this.configService.get('SMTP_USER')}>`,
      to: user.email,
      subject: 'Recuperación de Contraseña - MisFinanzas',
      html: `
        <h2>Hola ${user.name},</h2>
        <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de 6 dígitos:</p>
        <h1 style="color: #27ae60; letter-spacing: 5px;">${resetToken}</h1>
        <p>Este código expira en 15 minutos.</p>
        <p>Si no fuiste tú, puedes ignorar este correo.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error enviando correo:', error);
      // Podrías lanzar un InternalServerErrorException aquí si quieres bloquear el flujo si el correo falla
    }

    return {
      message: 'Si el correo existe, se ha enviado un código de recuperación',
    };
  }

  async verifyResetToken(dto: { email: string; token: string }) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.resetPasswordToken !== dto.token) {
      throw new UnauthorizedException('Código inválido o correo incorrecto');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('El código ha expirado');
    }

    return { message: 'Código válido' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.resetPasswordToken !== dto.token) {
      throw new UnauthorizedException('Código inválido o correo incorrecto');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('El código ha expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
