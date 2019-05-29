export type mix = (superclass: any) => MixinBuilder;

export class MixinBuilder {
    constructor(superclass: any)
    with(...mixins: any[]): any
}
