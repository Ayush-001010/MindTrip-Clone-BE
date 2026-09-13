import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface ISocketOutput {
    socketOptSuccess: boolean;
}

export default interface ISocketService {
    addToRoom(socket :  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> , tripID: string, userID: string, userName: string): Promise<ISocketOutput>;
}