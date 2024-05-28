import { Admin, Ctx, InjectBot, Start, Update } from '@grammyjs/nestjs';
import { Bot, Context } from 'grammy';

@Update()
export class GreeterUpdate {
    constructor(
        @InjectBot()
        private readonly bot: Bot<Context>,
    ) {}

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        // const me = await this.bot.api.getMe()
        ctx.reply(`Hey, I'm ${this.bot.botInfo.first_name}`);
    }

    @Admin()
    async onAdminCommand(@Ctx() ctx: Context): Promise<void> {
        // send id of the chat
        ctx.reply(`Chat ID: ${ctx.chat?.id}`);
    }
}
