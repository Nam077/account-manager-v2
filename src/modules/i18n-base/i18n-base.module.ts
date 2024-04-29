import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';

@Module({
    imports: [
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            fallbacks: {
                'en-US': 'en',
                'vi-VN': 'vi',
            },
            loaderOptions: {
                path: join(__dirname, '../../i18n/'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-lang']),
            ],
            typesOutputPath: join(__dirname, '../../../src/i18n/i18n.generated.ts'),
        }),
    ],
    exports: [],
    providers: [],
})
export class I18nBaseModule {}
