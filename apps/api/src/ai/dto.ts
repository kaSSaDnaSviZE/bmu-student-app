import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AiChatDto {
  @ApiProperty({ example: 'When is my next class?' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  message!: string;
}
