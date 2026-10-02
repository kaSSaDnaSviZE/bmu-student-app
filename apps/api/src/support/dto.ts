import { ApiProperty } from '@nestjs/swagger';
import { SupportCategory } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportRequestDto {
  @ApiProperty({ enum: SupportCategory })
  @IsEnum(SupportCategory)
  category!: SupportCategory;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  message!: string;
}
