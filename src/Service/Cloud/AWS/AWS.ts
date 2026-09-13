import ICloudService from "../../../Interface/ClassInterface/ICloudService";

export default class AWS implements ICloudService {
  getImages = (keys: string) => {
    const imageUrls: string[] = [];
    imageUrls.push(`https://${process.env.AWS_CloudFront_Domain}/${keys}`);
    return { cloudServiceSuccess: true, data: imageUrls[0] };
  };
}
