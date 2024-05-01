import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { REMOVE_FIELDS } from '../decorator';

@Injectable()
export class RemoveFieldInterceptor implements NestInterceptor {
    constructor() {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const removeFields: string[] = [
            'id',
            'createdAt',
            'updatedAt',
            'deletedAt',
            ...(Reflect.getMetadata(REMOVE_FIELDS, request.body.constructor) || []),
        ];
        removeFields.forEach((field) => {
            if (request.body[field]) {
                delete request.body[field];
            }
        });
        return next.handle();
    }
}
