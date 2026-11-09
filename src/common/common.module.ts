import { Global, Module } from '@nestjs/common';
import { R2Service } from '../storage/r2.service';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';

@Global()
@Module({
  providers: [MailService, R2Service, WhatsappService],
  exports: [MailService, R2Service, WhatsappService],
})
export class CommonModule {}
