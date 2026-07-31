import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";


@Catch()
export class GlobalExceptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost) {
        console.log(exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const status = exception instanceof HttpException ? exception.getStatus() : 500;

        const message = exception instanceof HttpException ? 
                         exception.getResponse()['message'] 
                         : 'Internal Server Error'

        return response.status(status).json({
            status:false,
            message:message
        });
    }
}