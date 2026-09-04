import AWS from "./AWS/AWS";

export default class CloudFactory {
    static getCloudServiceInstance() {
        return new AWS();
    }
}