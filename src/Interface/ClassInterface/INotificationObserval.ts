export default interface INotificationObserval {
    notify: (message: string) => Promise<void>;
}