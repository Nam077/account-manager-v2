import { ValidateIf, ValidationOptions } from 'class-validator';

export function IsOptionalCustom(options?: ValidationOptions): PropertyDecorator {
    return function optionalDecorator(prototype: object, propertyKey: string | symbol): void {
        ValidateIf((object) => object[propertyKey] !== undefined, options)(prototype, propertyKey);
    };
}
