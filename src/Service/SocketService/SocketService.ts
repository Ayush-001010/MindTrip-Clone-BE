import ISocketService, { ISocketOutput } from "../../Interface/ClassInterface/ISocketService";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import RedisService from "../RedisService/RedisService";

export default class SocketService implements ISocketService{
    redisServiceInstance : RedisService;

    constructor() {
        this.redisServiceInstance = new RedisService();
    }
    
    addToRoom = async (socket :  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> , tripID: string, userID: string, userName: string): Promise<ISocketOutput> => {
        const redisOptResponse = await this.redisServiceInstance.createOrUpdate(tripID,{
            userID,
            userName
        }, "list");
        if(!redisOptResponse.redisOptSuccess) {
            return { socketOptSuccess: false };
        }
        socket.join(tripID);
        
        return { socketOptSuccess: true };
    }
}