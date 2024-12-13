import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import { Bot, Context, InputFile } from 'grammy';
import { InjectBot } from '@grammyjs/nestjs';
import mysqldump from 'mysqldump';
import * as path from 'path';

@Injectable()
export class DatabaseDumpService implements OnModuleInit {
    constructor(
        private readonly configService: ConfigService,
        @InjectBot() private bot: Bot<Context>,
    ) {}

    private generateFileName(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const fileName = `schema-${year}-${month}-${day}.sql`;
        const folderPath = path.join(process.cwd(), 'backups');

        // Ensure the folder exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        return path.join(folderPath, fileName);
    }

    async dumpDatabase(): Promise<string> {
        const dumpFileName = this.generateFileName();

        try {
            await mysqldump({
                connection: {
                    host: this.configService.get<string>('DB_HOST'),
                    user: this.configService.get<string>('DB_USERNAME'),
                    password: this.configService.get<string>('DB_PASSWORD'),
                    database: this.configService.get<string>('DB_DATABASE'),
                },
                dumpToFile: dumpFileName,
            });

            console.log(`Database schema dumped to ${dumpFileName}`);

            return dumpFileName;
        } catch (error) {
            console.error('Error dumping database schema:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        console.log('Executing scheduled database dump');
        const dumpFileName = await this.dumpDatabase();

        if (dumpFileName) {
            await this.sendDumpToAdminBot(dumpFileName);
        }
    }

    async sendDumpToAdminBot(dumpFileName: string) {
        try {
            const adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
            
            if (!adminChatId) {
                throw new Error('TELEGRAM_ADMIN_CHAT_ID is not configured');
            }

            if (!fs.existsSync(dumpFileName)) {
                throw new Error(`Dump file not found at path: ${dumpFileName}`);
            }

            const date = new Date();
            const caption = `Database backup from ${date.toISOString()}`;

            // Send the file using InputFile from grammy
            await this.bot.api.sendDocument(adminChatId, new InputFile(dumpFileName), {
                caption: caption
            });

            console.log(`Database dump sent successfully to admin (Chat ID: ${adminChatId})`);
        } catch (error) {
            console.error('Error sending database dump to admin:', error);
            throw error; // Re-throw to handle it in the calling function
        }
    }

    async onModuleInit() {
        // Run the dump on startup
        const dumpFileName = await this.dumpDatabase();

        if (dumpFileName) {
            await this.sendDumpToAdminBot(dumpFileName);
        }
    }
}
