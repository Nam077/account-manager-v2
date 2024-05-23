import { DeepPartial } from 'typeorm';

export const removeKeys = <T extends object>(
    obj: DeepPartial<T>,
    keys: (keyof T & keyof DeepPartial<T>)[],
): DeepPartial<T> => {
    const clone: DeepPartial<T> = { ...obj };

    keys.forEach((key) => {
        if (key in clone) {
            delete clone[key];
        }
    });

    return clone;
};
