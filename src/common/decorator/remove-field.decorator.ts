import { SetMetadata } from '@nestjs/common';

export const REMOVE_FIELDS = 'removeFields';
export const RemoveFields = <T>(fields: Array<keyof T>) => SetMetadata(REMOVE_FIELDS, fields);
