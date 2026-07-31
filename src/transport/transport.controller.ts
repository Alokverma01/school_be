import {
  Controller,
  Post,
  Body,
  Put,
  Query,
  Get,
  Delete,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import {
  CreateVehicleDto,
  CreateRouteDto,
  AssignStudentTransportDto,
} from './transport.dto';

@Controller('transport')
export class TransportController {
  constructor(private readonly service: TransportService) {}

  @Post('create-driver')
  create(@Body() body: any) {
    return this.service.createDriver(body);
  }

  @Get('get-all-drivers')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.service.getAllDrivers(p, l);
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.service.getDriverById(id);
  }

  @Get('get-drivers-by-branch')
  findOneByBranch(@Query('id') id: number) {
    return this.service.getDriverByBranchId(id);
  }

  @Put('update-driver')
  update(@Query('id') id: number, @Body() body: any) {
    return this.service.updateDriver(id, body);
  }

  @Delete('delete-driver')
  remove(@Query('id') id: number) {
    return this.service.deleteDriver(id);
  }

  @Get('search-drivers')
  search(
    @Query('keyword') keyword: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.service.searchDrivers(keyword, p, l);
  }

  @Post('filter-drivers')
  filter(
    @Body() filters: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.service.filterDrivers(filters, p, l);
  }

  // vehicle
  @Post('create-vehicle')
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.service.createVehicle(dto);
  }

  // @Get('drivers')
  // findAllDrivers() {
  //   return this.service.findAllDrivers();
  // }

  @Put('update-vehicle')
  updateVehicle(@Query('id') id: number, @Body() dto: CreateVehicleDto) {
    return this.service.updateVehicle(id, dto);
  }

  @Get('get-vehicle-by-id')
  getVehicleById(@Query('id') id: number) {
    return this.service.getVehicleById(id);
  }

  @Get('get-vehicle-by-branch')
  getVehicleByBranchId(@Query('id') id: number) {
    return this.service.getVehicleByBranchId(id);
  }

  @Get('get-all-vehicles')
  getAllVehicles(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAllVehicles(page, limit);
  }

  @Delete('delete-vehicle')
  deleteVehicle(@Query('id') id: number) {
    return this.service.deleteVehicle(id);
  }

  @Get('search-vehicle')
  searchVehicles(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchVehicles(keyword, page, limit);
  }

  @Post('filter-vehicle')
  filterVehicles(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterVehicles(filters, page, limit);
  }

  // route
  @Post('create-route')
  createRoute(@Body() dto: CreateRouteDto) {
    return this.service.createRoute(dto);
  }

  @Put('update-route')
  updateRoute(@Query('id') id: number, @Body() dto: CreateRouteDto) {
    return this.service.updateRoute(id, dto);
  }

  @Get('get-route-by-id')
  getRouteById(@Query('id') id: number) {
    return this.service.getRouteById(id);
  }

  @Get('get-route-by-branch')
  getRouteByBranchId(@Query('id') id: number) {
    return this.service.getRouteByBranchId(id);
  }

  @Get('get-all-routes')
  getAllRoutes(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAllRoutes(page, limit);
  }

  @Delete('delete-route')
  deleteRoute(@Query('id') id: number) {
    return this.service.deleteRoute(id);
  }

  @Get('search-route')
  searchRoutes(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchRoutes(keyword, page, limit);
  }

  @Post('filter-route')
  filterRoutes(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterRoutes(filters, page, limit);
  }

  // assign student
  @Post('assign-student')
  assignStudent(@Body() dto: AssignStudentTransportDto) {
    return this.service.assignStudent(dto);
  }

  @Put('update-assign-student')
  updateAssignStudent(
    @Query('id') id: number,
    @Body() dto: AssignStudentTransportDto,
  ) {
    return this.service.updateAssignment(id, dto);
  }

  @Get('get-assign-student-by-id')
  getAssignmentById(@Query('id') id: number) {
    return this.service.getAssignmentById(id);
  }

  @Get('get-all-assign-student')
  getAllAssignments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAllAssignments(page, limit);
  }

  @Delete('delete-assign-student')
  deleteAssignStudent(@Query('id') id: number) {
    return this.service.deleteAssignment(id);
  }

  @Get('search-assign-students')
  searchAssignments(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchAssignments(keyword, page, limit);
  }

  @Post('filter-assign-students')
  filterAssignments(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterAssignments(filters, page, limit);
  }

}
