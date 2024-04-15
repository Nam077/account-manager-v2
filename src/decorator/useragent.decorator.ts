// src/common/decorators/useragent.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Details, parse } from 'express-useragent';

export const UserAgent = createParamDecorator((data: unknown, ctx: ExecutionContext): Details => {
    const request = ctx.switchToHttp().getRequest();
    const ua = request.headers['user-agent'];
    return parse(ua);
});
