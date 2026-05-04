import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class ReorderTaskItemDto {
  @IsInt()
  id: number;

  @IsInt()
  order: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderTaskItemDto)
  items: ReorderTaskItemDto[];
}
