export default interface APIResponseInterface<T> {
    success: boolean;
    data?:T;
    error?: string | string[];
}