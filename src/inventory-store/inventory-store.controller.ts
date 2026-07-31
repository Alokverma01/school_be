import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory-store.service';
import { CreateInventoryDto } from './inventory-store.dto';

@Controller('inventory')
export class InventoryController {
  constructor(readonly inventoryService: InventoryService) { }

  @Post('create')
  createItem(@Body() body: CreateInventoryDto) {
    return this.inventoryService.createItem(body);
  }

  @Put('update')
  updateItem(
    @Query('item_id') item_id: number,
    @Body() body: CreateInventoryDto,
  ) {
    return this.inventoryService.updateItem(item_id, body);
  }

  @Get('get-all')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.inventoryService.getAllItems(page, limit);
  }

  @Get('get-by-id')
  getById(@Query('item_id') item_id: number) {
    return this.inventoryService.getItemById(item_id);
  }

  @Get('get-by-branch')
  getItemByBranchId(@Query('branch_id') branch_id: number) {
    return this.inventoryService.getItemByBranchId(branch_id);
  }

  @Delete('delete')
  deleteItem(@Query('item_id') item_id: number) {
    return this.inventoryService.deleteItem(item_id);
  }

  @Get('search')
  search(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.searchItems(keyword, page, limit);
  }

  @Post('filter')
  filterItems(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.filterItems(filters, page, limit);
  }
}
