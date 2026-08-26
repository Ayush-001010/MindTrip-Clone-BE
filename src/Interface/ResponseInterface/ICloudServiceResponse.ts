export default interface ICloudServiceResponse<T> {
  cloudServiceSuccess: boolean;
  data: T;
}
