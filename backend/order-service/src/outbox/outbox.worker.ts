import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxWorker {
  constructor(
    private readonly outboxService: OutboxService,
  ) {}

  @Cron('*/15 * * * * *')
  async processOutbox() {
    await this.outboxService.processPendingEvents();
  }
}

