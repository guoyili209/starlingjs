module StarlingJS {
    export class AbstractClassError extends Error {
        constructor(message: any = "Cannot instantiate abstract class", id: any = 0) {
            super(message);
            console.log(id)
        }
    }
}