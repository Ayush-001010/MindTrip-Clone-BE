export interface IPolicy {
  strategy: "token-bucket" | "sliding-log";
  limit?: number;
  duration?: number;
}

export default interface IPolicyProvider {
  getPolicy: (userContext: any) => IPolicy;
}
