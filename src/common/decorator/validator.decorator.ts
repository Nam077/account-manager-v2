import { Transform } from 'class-transformer';
import { registerDecorator, ValidateIf, ValidationArguments, ValidationOptions } from 'class-validator';

import { toCapitalize, toLowerCase, toUpperCase } from '../helper/index';

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

export const IsEarlierThanDate =
    (property: string, validationOptions?: ValidationOptions) => (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isEarlierThan',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate: (value: any, args: ValidationArguments) => {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    if (!(value instanceof Date && relatedValue instanceof Date)) {
                        return false; // Ensures both values are Date instances
                    }

                    return value < relatedValue; // Compares dates
                },
                defaultMessage: (args: ValidationArguments) =>
                    `${args.property} should be earlier than ${args.constraints[0]}`,
            },
        });
    };

export const IsMatch =
    (property: string, validationOptions?: ValidationOptions) => (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isMatch',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate: (value: any, args: ValidationArguments) => {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    return value === relatedValue;
                },
                defaultMessage: (args: ValidationArguments) => `${args.property} should match ${args.constraints[0]}`,
            },
        });
    };
