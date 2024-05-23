import { has, unset } from 'lodash';
import { DeepPartial } from 'typeorm';

export const removeKeys = <T extends object>(
    obj: DeepPartial<T>,
    keys: (keyof T & keyof DeepPartial<T>)[],
): DeepPartial<T> => {
    const clone: DeepPartial<T> = { ...obj };

    keys.forEach((key) => {
        if (has(clone, key)) unset(clone, key);
    });

    return clone;
};
