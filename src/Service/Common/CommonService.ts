import models from "../../DB/model";
import ICommonService from "../../Interface/ClassInterface/ICommonService";
import IActivites from "../../Interface/DataInterface/IActivites";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";

export default class CommonService implements ICommonService {
    private static instance : CommonService;
    private constructor() {};
    private CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private stringToBase62 = (str: string) => {
    if (!str) return this.CHARS[0];
    // Convert string to hex, then to a BigInt
    const hex = Buffer.from(str, 'utf8').toString('hex');
    if (!hex) return this.CHARS[0];
    let num = BigInt('0x' + hex);

    if (num === 0n) return this.CHARS[0];

    let result = '';
    while (num > 0n) {
        result = this.CHARS[Number(num % 62n)] + result;
        num = num / 62n;
    }
    return result;
    }

    private base62ToString = (b62 : string) => {
    if (!b62) return '';
    let num = 0n;
    for (let i = 0; i < b62.length; i++) {
        const idx = this.CHARS.indexOf(b62[i]);
        if (idx === -1) throw new Error(`Invalid base62 character: ${b62[i]}`);
        const charIndex = BigInt(idx);
        num = num * 62n + charIndex;
    }

    let hex = num.toString(16);
    // Ensure even length for the hex string
    if (hex.length % 2 !== 0) hex = '0' + hex; 

    return Buffer.from(hex, 'hex').toString('utf8');
    }

    // Encode a UUID (canonical form with hyphens) to base62 using the 16 raw bytes
    uuidToBase62 = (uuid: string) => {
    if (!uuid) throw new Error('Invalid UUID');
    const hex = uuid.replace(/-/g, '');
    if (!/^[0-9a-fA-F]{32}$/.test(hex)) throw new Error('Invalid UUID format');
    let num = BigInt('0x' + hex);
    if (num === 0n) return this.CHARS[0];
    let result = '';
    while (num > 0n) {
        result = this.CHARS[Number(num % 62n)] + result;
        num = num / 62n;
    }
    return result;
    }

    public static getInstance() : CommonService {
        if(!CommonService.instance) {
            CommonService.instance = new CommonService();
        }
        return CommonService.instance;
    }

    activites = async (activityName : string) : Promise<APIResponseInterface<IActivites>> => {
        try {
            const response = await models.Activities.findAll({
                where :{
                    activityName
                }
            });
            if(response.length > 0) {
                const imageURL = `https://${process.env.AWS_CloudFront_Domain}/${response[0].dataValues.imageKey}`;
                return {
                    success : true,
                    data : {
                        id : response[0].dataValues.id,
                        activityName : response[0].dataValues.activityName,
                        imageURL : imageURL
                    }
                }
            }

            // Not found any activites
            return {
                success : false,
            }
        } catch(err) {
            return {
                success : false,
                error : "Error while fetching activites"
            }
        }
    }

    convertBase62 = (id : string, options?: { isUUID?: boolean }) : string => {
        if (options?.isUUID) return this.uuidToBase62(id);
        return this.stringToBase62(id);
    }
}