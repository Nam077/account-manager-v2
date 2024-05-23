import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { from, Observable } from 'rxjs';

@Injectable()
export class RefreshGuard extends AuthGuard('refresh-strategy') {
    constructor() {
        super();
    }

    canActivate(context: ExecutionContext): Observable<boolean> {
        const rs = super.canActivate(context);

        if (rs instanceof Observable) {
            return rs;
        } else if (rs instanceof Promise) {
            return from(rs);
        }
    }
}
