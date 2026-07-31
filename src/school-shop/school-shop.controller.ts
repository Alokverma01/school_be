import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ShopService } from './school-shop.service';
import { CreateProductDto, CreateOrderDto } from './school-shop.dto';

@Controller('shop')
export class ShopController {
  constructor(readonly shopService: ShopService) {}

  // Products
  // @Post('products/create')
  // createProduct(@Body() body: CreateProductDto) {
  //   return this.shopService.createProduct(body);
  // }

  // @Get('products')
  // getProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
  //   return this.shopService.getProducts(page, limit);
  // }

  // @Get('products/details')
  // getProductById(@Query('product_id') product_id: number) {
  //   return this.shopService.getProductById(product_id);
  // }

  // @Put('products/update')
  // updateProduct(
  //   @Query('product_id') product_id: number,
  //   @Body() body: CreateProductDto,
  // ) {
  //   return this.shopService.updateProduct(product_id, body);
  // }

  // @Delete('products/delete')
  // deleteProduct(@Query('product_id') product_id: number) {
  //   return this.shopService.deleteProduct(product_id);
  // }

  // @Get('products/search')
  // searchProducts(
  //   @Query('keyword') keyword: string,
  //   @Query('page') page?: number,
  //   @Query('limit') limit?: number,
  // ) {
  //   return this.shopService.searchProducts(keyword, page, limit);
  // }

  // Orders
  @Post('orders/create')
  createOrder(@Body() body: CreateOrderDto) {
    return this.shopService.createOrder(body);
  }

  @Get('get-orders')
  getOrders(
    @Query('student_id') student_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shopService.getOrders(student_id, page, limit);
  }

  @Get('orders/details')
  getOrderDetails(@Query('order_id') order_id: number) {
    return this.shopService.getOrderDetails(order_id);
  }

  @Put('orders/update')
  updateOrder(@Query('order_id') order_id: number, @Body() body: any) {
    return this.shopService.updateOrder(order_id, body);
  }

  @Delete('orders/delete')
  deleteOrder(@Query('order_id') order_id: number) {
    return this.shopService.deleteOrder(order_id);
  }

  @Get('orders/search')
  searchOrders(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shopService.searchOrders(keyword, page, limit);
  }

  @Post('orders/filter')
  filterOrders(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shopService.filterOrders(filters, page, limit);
  }
}
