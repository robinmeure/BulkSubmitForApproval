declare interface IPublishCommandSetStrings {
  Command1: string;
  Command2: string;
}

declare module 'PublishCommandSetStrings' {
  const strings: IPublishCommandSetStrings;
  export = strings;
}
