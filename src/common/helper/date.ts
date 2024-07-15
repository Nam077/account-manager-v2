import * as moment from 'moment';

export const checkDate = (checkDate: Date): boolean => {
    const currentDate = moment().startOf('day');
    const date = moment(checkDate).startOf('day');

    return currentDate.isAfter(date) || currentDate.isSame(date);
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
    if (moment(date).date() === 31) {
        return moment(date).add(months, 'months').date(30).toDate();
    }

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
 * @returns Là true nếu date truyền vào nhỏ hơn hoặc bằng date2, ngược lại là false.
 */
export const checkDateBefore = (date: Date, date2: Date): boolean => {
    return moment(date).isBefore(date2) || moment(date).isSame(date2);
};

export const checkDateBeforeNoEqual = (date: Date, date2: Date): boolean => {
    return moment(date).isBefore(date2);
};

// kiểm tra xem date có bằng date2 không
export const checkDateEqual = (date: Date, date2: Date): boolean => {
    return moment(date).isSame(date2);
};

// tinhtoan so ngay giua 2 ngay
export const daysBetween = (date: Date, date2: Date): number => {
    return moment(date).diff(moment(date2), 'days');
};

// tính toán số ngày hiện tại giữa ngày hiện tại với ngày truyền vào
export const daysBetweenNow = (date: Date): number => {
    return moment(date).diff(moment(new Date()).startOf('day'), 'days');
};

export const checkDateRenew = (endDate: Date, startDate: Date): boolean => {
    return moment(startDate).isAfter(endDate) || moment(startDate).isSame(endDate);
};
