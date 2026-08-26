import ICloudServiceResponse from "../ResponseInterface/ICloudServiceResponse";

export default interface ICloudService {
    getImages : (keys : string) => ICloudServiceResponse<string>;
}