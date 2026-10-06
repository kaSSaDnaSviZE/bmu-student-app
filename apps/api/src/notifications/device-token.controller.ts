import { Body, Controller, Delete, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { DeviceTokenService } from './push.provider';

class DeviceTokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(4096)
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}

class RevokeDeviceTokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(4096)
  token!: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications/devices')
export class DeviceTokenController {
  constructor(private readonly devices: DeviceTokenService) {}

  @Post()
  @RequirePermissions(Permissions.DeviceTokensManageOwn)
  register(@CurrentUser() user: AuthUser, @Body() dto: DeviceTokenDto) {
    return this.devices.register(user.id, dto.token, dto.platform);
  }

  @Delete()
  @HttpCode(200)
  @RequirePermissions(Permissions.DeviceTokensManageOwn)
  revoke(@CurrentUser() user: AuthUser, @Body() dto: RevokeDeviceTokenDto) {
    return this.devices.revoke(user.id, dto.token);
  }
}
