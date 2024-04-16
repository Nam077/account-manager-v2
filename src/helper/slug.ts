import slugify from 'slugify';

export const slugifyString = (text: string): string => {
    return slugify(text, {
        replacement: '-',
        lower: true,
        strict: true,
        locale: 'vi',
    });
};
