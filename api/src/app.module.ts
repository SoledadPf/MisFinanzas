import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Variables de entorno
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a SQL Server
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST', '192.168.18.22'),
        port: 1433,
        username: config.get('DB_USERNAME', 'sa'),
        password: config.get('DB_PASSWORD', 'bruno2356'),
        database: config.get('DB_DATABASE', 'MisFinanzasDB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Usamos scripts SQL manuales
        options: {
          encrypt: false, // Para conexión local
          trustServerCertificate: true,
        },
      }),
    }),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    CategoriesModule,
    ExpensesModule,
    PaymentsModule,
    DashboardModule,
  ],
})
export class AppModule {}
