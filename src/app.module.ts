import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './auth/auth-middleware';
import { RoleModule } from './role/role.module';
import { DepartmentModule } from './department/department.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { BranchesModule } from './branches/branches.module';
import { ClassesModule } from './classes/classes.module';
import { TeachersModule } from './teachers/teachers.module';
import { SectionsModule } from './sections/sections.module';
import { StudentsModule } from './students/students.module';
import { HostelsModule } from './hostels/hostels.module';
import { SubjectsModule } from './subjects/subjects.module';
import { RoomsModule } from './rooms/rooms.module';
import { TimetableModule } from './timetable/timetable.module';
import { FeeModule } from './fee/fee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { HolidaysModule } from './holidays/holidays.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { DocumentsModule } from './document/document.module';
import { ExamReportModule } from './exam-report/exam-report.module';
import { TransportModule } from './transport/transport.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AssetModule } from './asset/asset.module';
import { LibraryModule } from './library/library.module';
import { TeacherPayrollLeaveModule } from './teacher-payroll-leave/teacher-payroll-leave.module';
import { InventoryStoreModule } from './inventory-store/inventory-store.module';
import { SchoolShopModule } from './school-shop/school-shop.module';
import { EducationLevelsModule } from './dropdowns/education_levels/education_levels.module';
import { TeachingEligibilityExamsModule } from './dropdowns/teaching_eligibility_exams/teaching_eligibility_exams.module';
import { QualificationsModule } from './dropdowns/qualifications/qualifications.module';
import { SpecializationsModule } from './dropdowns/specializations/specializations.module';
import { InstituteTypesModule } from './dropdowns/institute_types/institute_types.module';
import { DegreeModule } from './dropdowns/degree/degree.module';
import { DocumentTypesModule } from './dropdowns/document_types/document_types.module';
import { CertificateTypeModule } from './dropdowns/certificate_type/certificate_type.module';
import { AssetLocation } from './dropdowns/asset_location/asse_location.entity';
import { AssetLocationModule } from './dropdowns/asset_location/asset_location.module';
import { AssetStatusModule } from './dropdowns/asset_status/asset_status.module';
import { AssetCategoriesModule } from './dropdowns/asset_categories/asset_categories.module';
import { VehicleTypeModule } from './dropdowns/vehicle_type/vehicle_type.module';
import { FeesTypesModule } from './dropdowns/fees_types/fees_types.module';
import { PaymentsModesModule } from './dropdowns/payments_modes/payments_modes.module';
import { ProductCategory } from './dropdowns/product_categories/product_categories.entity';
import { ProductCategoriesModule } from './dropdowns/product_categories/product_categories.module';
import { CommonModule } from './common/common.module';
import { MasterClass } from './dropdowns/master_classes/master_classes.entity';
import { MasterClassesModule } from './dropdowns/master_classes/master_classes.module';
import { ExamTypeModule } from './dropdowns/exam_type/exam_type.module';
import { ReportsModule } from './reports/reports.module';
import { MasterSubjectsModule } from './dropdowns/master_subjects/master_subjects.module';
import * as cloudinary from 'cloudinary';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // Makes ConfigModule available everywhere
      envFilePath: '.env',   // Optional, defaults to .env
    }),

    MulterModule.register({
      storage: memoryStorage(),
    }),

    // Async configuration for TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
  console.log('DB_HOST=', configService.get('DB_HOST'));
  console.log('DB_PORT=', configService.get('DB_PORT'));
  console.log('DB_USER=', configService.get('DB_USER'));
  console.log('DB_PASSWORD=', configService.get('DB_PASSWORD'));
  console.log('DB_NAME=', configService.get('DB_NAME'));

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: true,
  };
},
      inject: [ConfigService],
    }),
    RoleModule,
    DepartmentModule,
    UserModule,
    AuthModule,
    NewsModule,
    BranchesModule,
    ClassesModule,
    TeachersModule,
    SectionsModule,
    StudentsModule,
    HostelsModule,
    SubjectsModule,
    RoomsModule,
    TimetableModule,
    FeeModule,
    AttendanceModule,
    ExamReportModule,
    TransportModule,
    ComplaintsModule,
    CertificatesModule,
    AssetModule,
    LibraryModule,
    HolidaysModule,
    AssignmentsModule,
    DocumentsModule,
    TeacherPayrollLeaveModule,
    InventoryStoreModule,
    SchoolShopModule,
    EducationLevelsModule,
    TeachingEligibilityExamsModule,
    QualificationsModule,
    SpecializationsModule,
    InstituteTypesModule,
    DegreeModule,
    DocumentTypesModule,
    CertificateTypeModule,
    AssetLocationModule,
    AssetStatusModule,
    AssetCategoriesModule,
    VehicleTypeModule,
    FeesTypesModule,
    PaymentsModesModule,
    ProductCategoriesModule,
    CommonModule,
    MasterClassesModule,
    ExamTypeModule,
    ReportsModule,
    MasterSubjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide:'CLOUDINARY',
      useFactory:(configService:ConfigService)=>{
        return cloudinary.v2.config({
          cloud_name:configService.get('CLOUDINARY_CLOUD_NAME'),
          api_key:configService.get('CLOUDINARY_API_KEY'),
          api_secret:configService.get('CLOUDINARY_API_SECRET'),
        })
      },
      inject:[ConfigService]
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(AuthMiddleware).exclude('auth/login').forRoutes('*');
  }
}
