import { Transform } from 'class-transformer';
import { ValidateIf, ValidationOptions } from 'class-validator';

import { toCapitalize, toLowerCase, toUpperCase } from './string';

export const IsOptionalCustom = (options?: ValidationOptions): PropertyDecorator => {
    return (prototype: object, propertyKey: string | symbol): void => {
        ValidateIf((object) => object[propertyKey] !== undefined, options)(prototype, propertyKey);
    };
};

export const ToCapitalize = (): PropertyDecorator =>
    Transform(({ value }) => (typeof value === 'string' ? toCapitalize(value) : value));

export const ToUpperCase = (): PropertyDecorator =>
    Transform(({ value }) => (typeof value === 'string' ? toUpperCase(value) : value));

export const ToLowerCase = (): PropertyDecorator =>
    Transform(({ value }) => (typeof value === 'string' ? toLowerCase(value) : value));
