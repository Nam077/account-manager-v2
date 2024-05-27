import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import mysqldump from 'mysqldump';
import * as path from 'path';

@Injectable()
export class DatabaseDumpService implements OnModuleInit {
    constructor(private readonly configService: ConfigService) {}

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

    async dumpDatabase(): Promise<void> {
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
            console.log(`Database schema dumped successfully to ${dumpFileName}`);
        } catch (error) {
            console.error('Error dumping database schema:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        console.log('Executing scheduled database dump');
        await this.dumpDatabase();
    }

    async onModuleInit() {
        // Run the dump on startup
        await this.dumpDatabase();
    }
}
