import { Controller, Post, Get, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { CoordinatorService } from './coordinator/coordinator.service';

@Controller('workflow')
export class AppController {

  constructor(
    private readonly appService: AppService,
    private readonly coordinatorService: CoordinatorService) { }

  @Post('start-invoice')
  async startInvoiceWorkflow(@Body('customerId') customerId: string) {
    await this.coordinatorService.startInvoiceWorkflow(customerId);
    return { message: 'Invoice workflow started', customerId };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}


