import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ScheduleQueryDto {
  @ApiPropertyOptional({ enum: ['today', 'tomorrow', 'week', 'next'], default: 'today' })
  @IsOptional()
  @IsIn(['today', 'tomorrow', 'week', 'next'])
  scope?: 'today' | 'tomorrow' | 'week' | 'next';
}

export class GradeTargetDto {
  @ApiProperty()
  @IsString()
  courseId!: string;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  target!: number;
}

export class SubmitAssignmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body!: string;
}
