/* eslint-disable security/detect-unsafe-regex */
import { Admin, Ctx, Hears, InjectBot, Message, Start, Update } from '@grammyjs/nestjs';
import { Bot, Context } from 'grammy';

import { RentalService } from '../rental/rental.service';

const checkPattern = /^\/check(?:\s+(.*))?$/;

@Update()
export class GreeterUpdate {
    constructor(
        @InjectBot()
        private readonly bot: Bot<Context>,
        private readonly rentalService: RentalService,
    ) {}

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        ctx.reply(`Hey, I'm ${this.bot.botInfo.first_name}`);
    }

    @Admin()
    async onAdminCommand(@Ctx() ctx: Context): Promise<void> {
        // send id of the chat
        ctx.reply(`Chat ID: ${ctx.chat?.id}`);
    }

    @Hears(checkPattern)
    async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
        const match = text.match(checkPattern);
        const message = match && match[1] ? match[1].split(' ')[0] : null;

        if (message === null) {
            this.rentalService.checkExpiredAllPaginated().subscribe(
                () => {
                    return ctx.reply('Kiểm tra thành công');
                },
                (error) => {
                    return ctx.reply(`Error: ${error}`);
                },
            );
        } else {
            this.rentalService.checkExpiredAllPaginated(100, message).subscribe(() => {
                return ctx.reply(`Kiểm tra thành công`);
            });
        }
    }
}
