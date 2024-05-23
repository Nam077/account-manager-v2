import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { from, Observable } from 'rxjs';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    public example(): void {
        this.mailerService
            .sendMail({
                to: 'namnguyen177a@gmail.com', // list of receivers
                from: 'nampronam1@gmail.com', // sender address
                subject: 'Testing Nest Mailermodule with template ✔',
                template: 'index', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
                context: {
                    code: 'cf1a3f828287',
                    username: 'john doe',
                },
            })
            .then(() => {})
            .catch(() => {});
    }

    public sendMailWarningNearExpired(
        to: string,
        context: {
            name: string;
            email: string;
            accountName: string;
            expiredAt: Date;
            daysLeft: number;
        },
    ): Observable<void> {
        return from(
            this.mailerService.sendMail({
                to,
                from: this.configService.get('MAIL_FROM'),
                subject: 'Warning: Account near expired',
                template: 'warning-near-expired',
                context: {
                    ...context,
                    company: this.configService.get('COMPANY_NAME'),
                },
            }),
        );
    }

    public sendMailExpired(
        to: string,
        context: {
            name: string;
            email: string;
            accountName: string;
            expirationDate: Date;
        },
    ): Observable<void> {
        return from(
            this.mailerService.sendMail({
                to,
                from: this.configService.get('MAIL_FROM'),
                subject: 'Expired: Account expired',
                template: 'expired',
                context: {
                    ...context,
                    company: this.configService.get('COMPANY_NAME'),
                },
            }),
        );
    }
}
