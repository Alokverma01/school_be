// src/payments-modes/payments-modes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { PaymentsModesService } from './payments_modes.service';

@Controller('payment-modes')
export class PaymentsModesController {
  constructor(private readonly paymentsModesService: PaymentsModesService) {}

  @Post('add')
  async create(@Body('payment_mode') payment_mode: string) {
    return this.paymentsModesService.create(payment_mode);
  }

  @Get('get-all')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : undefined;
    const limitNum = limit ? parseInt(limit) : undefined;
    return this.paymentsModesService.findAll(pageNum, limitNum);
  }

  @Get('get-by-id')
  async findOne(@Query('id') id: number) {
    return this.paymentsModesService.findOne(id);
  }

  @Patch('update')
  async update(
    @Query('id') id: number,
    @Body('payment_mode') payment_mode: string,
  ) {
    return this.paymentsModesService.update(id, payment_mode);
  }

  @Delete('delete')
  async remove(@Query('id', ParseIntPipe) id: number) {
    return this.paymentsModesService.remove(id);
  }
}