import { Injectable, Logger } from '@nestjs/common';
import { TaskService } from '../tasks/task.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class CoordinatorService {
  private readonly logger = new Logger(CoordinatorService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly taskService: TaskService,
  ) {}

  async startInvoiceWorkflow(customerId: string) {
    this.logger.log(`Starting invoice workflow for customer: ${customerId}`);

    // Step 1: Fetch orders
    await this.queueService.enqueueTask('FetchOrders', { customerId });

    // Normally, you’d want callbacks or event-based triggering for the next steps after task completion.
    // For PoC, simulate next steps by enqueuing them with delay or via a polling mechanism.

    // Here, just a simple example of chaining:
    // This could be enhanced with proper workflow state tracking and event triggers.
  }
}
