import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { VehicleTypeService } from './vehicle_type.service';

@Controller('vehicle-types')
export class VehicleTypeController {
  constructor(private readonly vehicleTypeService: VehicleTypeService) {}

  @Post('add')
  create(@Body('vehicle_type') vehicle_type: string) {
    return this.vehicleTypeService.create(vehicle_type);
  }

  @Get('get-all')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.vehicleTypeService.findAll(p, l);
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.vehicleTypeService.findOne(id);
  }

  @Put('update')
  update(
    @Query('id') id: number,
    @Body('vehicle_type') vehicle_type: string,
  ) {
    return this.vehicleTypeService.update(id, vehicle_type,);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleTypeService.remove(id);
  }
}