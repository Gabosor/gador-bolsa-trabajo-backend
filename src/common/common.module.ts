import { Global, Module } from '@nestjs/common';
import { R2Service } from '../storage/r2.service';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService, R2Service],
  exports: [MailService, R2Service],
})
export class CommonModule {}
