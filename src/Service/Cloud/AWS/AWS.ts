import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ICloudService from "../../../Interface/ClassInterface/ICloudService";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export default class AWS implements ICloudService {
  getImages = (keys: string) => {
    const imageUrls: string[] = [];
    imageUrls.push(`https://${process.env.AWS_CloudFront_Domain}/${keys}`);
    return { cloudServiceSuccess: true, data: imageUrls[0] };
  };

  getUploadedFileURL = async (contentType: string, key: string) => {
    try {
      const s3ClientObj = new S3Client({
        region: "ap-south-1",
        credentials: {
          accessKeyId: process.env.AWSAccessKeyId || "",
          secretAccessKey: process.env.AWSSecretAccessKey || "",
        },
      });

      const command = new PutObjectCommand({
        Bucket: "project-shop-management",
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3ClientObj, command, { expiresIn: 60 });
      return url;
    } catch (error) {
      console.log("Error  ", error);
      return null;
    }
  };
}
