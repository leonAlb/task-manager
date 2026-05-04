import {
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsInt,
  IsDefined,
  ValidateIf,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ValidateIf((dto: UpdateTaskDto) => dto.status !== undefined)
  @IsDefined()
  @IsInt()
  order?: number;
}
