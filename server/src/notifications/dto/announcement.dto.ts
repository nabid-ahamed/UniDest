import { IsIn, IsOptional, IsString, MinLength } from 'class-validator'

const AREAS = ['All', 'Students', 'Leads', 'Staff']

export class CreateAnnouncementDto {
  @IsString() @MinLength(1) title!: string
  @IsString() @MinLength(1) message!: string
  @IsOptional() @IsIn(AREAS) area?: string
  /** ISO datetime; defaults to now. A future value schedules it. */
  @IsOptional() @IsString() publishedAt?: string
}

export class UpdateAnnouncementDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() message?: string
  @IsOptional() @IsIn(AREAS) area?: string
  @IsOptional() @IsString() publishedAt?: string
}
