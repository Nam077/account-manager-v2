export const caculatorTotalPrice = (price: number, discount: number): number => {
    return price - (price * discount) / 100;
};
console.log(caculatorTotalPrice(100, 10));
