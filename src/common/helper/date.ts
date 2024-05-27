import * as moment from 'moment';

export const checkDate = (checkDate: Date): boolean => {
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    const date = moment(checkDate).format('YYYY-MM-DD');

    return moment(currentDate).diff(date, 'days') > 0;
};

export const checkDaysDifference = (checkDate: Date, days: number): boolean => {
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    const date = moment(checkDate).format('YYYY-MM-DD');
    const dayBefore = moment(date).subtract(days, 'days');

    return moment(currentDate).isSame(dayBefore);
};

export const checkDateAfter = (date: Date, date2: Date): boolean => {
    return moment(date).isAfter(date2);
};

export const addMonths = (date: Date, months: number): Date => {
    return moment(date).add(months, 'months').toDate();
};

export const addDays = (date: Date, days: number): Date => {
    return moment(date).add(days, 'days').toDate();
};

export const addYears = (date: Date, years: number): Date => {
    return moment(date).add(years, 'years').toDate();
};

export const formatDate = (date: Date): string => {
    return moment(date).format('YYYY-MM-DD');
};

export const formatDateTime = (date: Date): string => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

export const addLifeTime = (date: Date): Date => {
    return addYears(date, 100);
};

export const addDate = (date: Date, days: number): Date => {
    switch (days) {
        case 30:
            return addMonths(date, 1);
        case 90:
            return addMonths(date, 3);
        case 180:
            return addMonths(date, 6);
        case 365:
            return addYears(date, 1);
        case -9999:
            return addLifeTime(date);
        default:
            return addDays(date, days);
    }
};

/**
 * Checks if a date is before another date.
 * @param date - The first date to compare.
 * @param date2 - The second date to compare.
 * @returns A boolean indicating whether the first date is before the second date.
 */
export const checkDateBefore = (date: Date, date2: Date): boolean => {
    return moment(date).isBefore(date2);
};
