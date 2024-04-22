// src/common/decorators/geoip.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Lookup, lookup } from 'geoip-lite';

export interface GeoIpI {
    ip: string;
    geo: Lookup;
}
export const GeoIp = createParamDecorator((data: unknown, ctx: ExecutionContext): GeoIpI => {
    const request = ctx.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const geo: Lookup = lookup(ip);
    return { ip, geo };
});
