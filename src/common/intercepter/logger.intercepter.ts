import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { LoggerService } from '../helper/logger';
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const now = Date.now();
        const body = request.body;
        const params = request.params;
        const query = request.query;
        const user = request.user;
        return next.handle().pipe(
            tap(() => {
                Logger.log(`${method} ${url} ${Date.now() - now}ms`, context.getClass().name);
            }),
            map((data) => {
                const message = {
                    url,
                    method,
                    user,
                    body,
                    params,
                    query,
                    // data,
                };
                this.logger.info(message, '中间件记录日志');
                return data;
            }),
        );
    }
}
