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
