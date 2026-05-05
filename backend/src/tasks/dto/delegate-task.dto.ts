import { IsInt, IsPositive } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class DelegateTaskDto extends CreateTaskDto {
  @IsInt()
  @IsPositive()
  userId: number;
}
