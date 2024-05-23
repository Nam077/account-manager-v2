import { Command, Ctx, Start, Update } from 'nestjs-telegraf';

import { TelegrafContext } from '../rental/rental.service';

@Update()
export class GreeterUpdate {
    @Start()
    onStart(): string {
        return 'Say hello to me';
    }

    @Command('admin')
    async on(@Ctx() ctx: TelegrafContext) {
        await ctx.reply(ctx.from.id.toString());
    }
}
