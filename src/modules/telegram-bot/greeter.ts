import { Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';

import { TelegrafContext } from '../rental/rental.service';
@Update()
export class GreeterUpdate {
    @Start()
    onStart(): string {
        return 'Say hello to me';
    }
    @Hears(['hi', 'hello', 'hey', 'qq'])
    onHello(ctx: TelegrafContext): void {
        ctx.reply(JSON.stringify(ctx.update));
    }
    @Command('admin')
    async on(@Ctx() ctx: TelegrafContext) {
        await ctx.reply(ctx.from.id.toString());
    }
}
