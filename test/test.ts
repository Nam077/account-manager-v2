const removeKeys = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const clone = { ...obj };
    keys.forEach((key) => {
        delete clone[key];
    });
    return clone;
};
interface User {
    id: number;
    name: string;
    age: number;
}

const user: User = {
    id: 1,
    name: 'John',
    age: 25,
};

const userWithoutId = removeKeys(user, ['id', 'age']);
console.log(userWithoutId);
