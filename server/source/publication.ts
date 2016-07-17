export type PublishHandler = (...args) => Mongo.Cursor<any>;

export class Publication {
	
    constructor(
        public name: string,
        public handler: PublishHandler,
        public fields: string[]
    ) { }
}
