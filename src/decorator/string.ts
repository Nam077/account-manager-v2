export const toLowerCase = (str: string): string => str.toLowerCase();
export const toUpperCase = (str: string): string => str.toUpperCase();
export const toCapitalize = (str: string): string => {
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
