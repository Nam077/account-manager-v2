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
                subject: 'Cảnh báo: Tài khoản sắp hết hạn',
                template: 'warning-near-expired',
                context: {
                    ...context,
                    company: this.configService.get('COMPANY_NAME'),
                    webUrl: this.configService.get('WEB_URL'),
                    contactUrl: this.configService.get('CONTACT_URL'),
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
                subject: 'Thông báo: Tài khoản đã hết hạn',
                template: 'expired',
                context: {
                    ...context,
                    company: this.configService.get('COMPANY_NAME'),
                    webUrl: this.configService.get('WEB_URL'),
                    contactUrl: this.configService.get('CONTACT_URL'),
                },
            }),
        );
    }
}
