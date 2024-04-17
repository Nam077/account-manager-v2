import { Transform } from 'class-transformer';
import { ValidateIf, ValidationOptions } from 'class-validator';
import { toUpperCase, toLowerCase, toCapitalize } from './string';
export function IsOptionalCustom(options?: ValidationOptions): PropertyDecorator {
    return function optionalDecorator(prototype: object, propertyKey: string | symbol): void {
        ValidateIf((object) => object[propertyKey] !== undefined, options)(prototype, propertyKey);
    };
}
export function ToUpperCase(): PropertyDecorator {
    return Transform(({ value }) => (typeof value === 'string' ? toUpperCase(value) : value));
}

export function ToLowerCase(): PropertyDecorator {
    return Transform(({ value }) => (typeof value === 'string' ? toLowerCase(value) : value));
}

export function ToCapitalize(): PropertyDecorator {
    return Transform(({ value }) => (typeof value === 'string' ? toCapitalize(value) : value));
}
