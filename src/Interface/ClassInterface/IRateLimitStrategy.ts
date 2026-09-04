import IUserInfo from '../DataInterface/IUserInfo';

export default interface IRateLimitStrategy {
    check(user : IUserInfo): Promise<boolean>;
}