import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { has, unset } from 'lodash';
import { Observable } from 'rxjs';

import { REMOVE_FIELDS } from '../decorator';

@Injectable()
export class RemoveFieldInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        const removeFields: string[] = [
            'id',
            'createdAt',
            'updatedAt',
            'deletedAt',
            ...(this.reflector.get<string[]>(REMOVE_FIELDS, context.getHandler()) || []),
        ];

        removeFields.forEach((field) => {
            if (has(request.body, field)) unset(request.body, field);
        });

        return next.handle();
    }
}
