import models from "../../DB/model";
import ICommonService from "../../Interface/ClassInterface/ICommonService";
import IActivites from "../../Interface/DataInterface/IActivites";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";

export default class CommonService implements ICommonService {
    private static instance : CommonService;
    private constructor() {}
    public static getInstance() : CommonService {
        if(!CommonService.instance) {
            CommonService.instance = new CommonService();
        }
        return CommonService.instance;
    }

    public activites = async (activityName : string) : Promise<APIResponseInterface<IActivites>> => {
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
}