import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { FeeService } from './fee.service';
import { CreateFeeStructureDto } from './create-fee_structure.dto';
import { CreateFeePaymentDto } from './create-fee_payment.dto';

@Controller('fee')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // Fee structure
  @Post('add-fee-structure')
  createStructure(@Body() dto: CreateFeeStructureDto) {
    return this.feeService.createFeeStructure(dto);
  }

  @Get('get-fee-structure')
  findStructures(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.feeService.getAllFeeStructures(page, limit);
  }

  @Get('get-fee-structure-by-id')
  findStructureById(@Query('id') id: number) {
    return this.feeService.getFeeStructureById(id);
  }

  @Get('get-fee-structure-by-branch')
  getFeeStructureByBranchId(@Query('id') id: number) {
    return this.feeService.getFeeStructureByBranchId(id);
  }

  @Get('get-transport-fee-structure-by-branch')
  getTransportFeeStructureByBranchId(@Query('branch_id') branch_id: number) {
    return this.feeService.getTransportFeeStructureByBranch(branch_id);
  }

  // @Get('get-fee-structure-by-branch')
  // getFeeStructuresByBranch(
  //   @Query('branch_id') branchId: number,
  //   @Query('class_id') classId?: string,
  // ) {
  //   const parsedClassId = classId ? parseInt(classId) : undefined;
  //   return this.feeService.getFeeStructuresByBranch(branchId, parsedClassId);
  // }

  @Put('update-fee-structure')
  updateStructure(@Query('id') id: number, @Body() dto: CreateFeeStructureDto) {
    return this.feeService.updateFeeStructure(id, dto);
  }

  @Delete('delete-fee-structure')
  deleteStructure(@Query('id') id: number) {
    return this.feeService.deleteFeeStructure(id);
  }

  @Get('search-fee-structure')
  async searchFeeStructure(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feeService.searchFeeStructures(keyword, page, limit);
  }

  @Post('filter-fee-structure')
  async filterFeeStructures(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feeService.filterFeeStructures(filters, page, limit);
  }

  // Payments
  @Post('add-payment')
  createPayment(@Body() dto: CreateFeePaymentDto) {
    return this.feeService.createPayment(dto);
  }

  @Get('get-all-payment')
  findPayments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.feeService.getPayments(page, limit);
  }

  @Get('get-payment-by-id')
  findPaymentsById(@Query('id') id: number) {
    return this.feeService.getPaymentById(id);
  }

  @Put('update-payment')
  updatePayment(@Query('id') id: number, @Body() dto: CreateFeePaymentDto) {
    return this.feeService.updatePayment(id, dto);
  }

  @Delete('delete-payment')
  deletePayment(@Query('id') id: number) {
    return this.feeService.deletePayment(id);
  }

  @Get('search-payment')
  async searchFeePayments(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feeService.searchFeePayments(keyword, page, limit);
  }

  @Post('filter-payment')
  async filterFeePayments(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feeService.filterFeePayments(filters, page, limit);
  }
}
