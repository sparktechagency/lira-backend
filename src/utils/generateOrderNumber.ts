import { v4 as uuidv4 } from 'uuid';
const generateOrderNumber = (prefix: string): string => {
     const uniqueId = uuidv4().split('-')[0];
     return `${prefix}${uniqueId}`;
};

export default generateOrderNumber;
