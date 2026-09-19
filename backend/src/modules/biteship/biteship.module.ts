import { Module } from '@nestjs/common';
import { BiteshipController } from './biteship.controller';
import { BiteshipService } from './biteship.service';

@Module({
  controllers: [BiteshipController],
  providers: [BiteshipService],
})
export class BiteshipModule {}

