export default interface IImportantDateResponse {
    to : Date;
    from : Date;
    type : "long-weekend" | "long-birthday-weekend" | "long-anniversary-weekend" | "birthday" | "anniversary";
}