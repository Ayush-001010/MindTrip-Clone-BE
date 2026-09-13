export interface IDatabaseResponse<T> {
  dataSuccess: boolean;
  data: T | null;
}
