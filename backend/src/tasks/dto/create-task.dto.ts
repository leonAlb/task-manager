import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @IsNotEmpty()
  @IsEnum(TaskPriority)
  priority: TaskPriority;
}
