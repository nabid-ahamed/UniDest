import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { StudentScopeService } from './student-scope.service'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secrets are passed per-call in AuthService (access and refresh use
    // different ones), so nothing is registered globally here.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, StudentScopeService],
  exports: [AuthService, StudentScopeService],
})
export class AuthModule {}
