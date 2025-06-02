import { forEach } from 'lodash'
import Action from '../Action'
import ActionArg from '../ActionArg'
import ActionArgSpec from './ActionArgSpec'
import { ActionTypeSpec } from '../../enums/ActionTypeSpec'

export default class ActionSpec {
    public categoryCode: number = 0
    public code: number = 0
    public name: string = ''
    public canFail: boolean = false
    public args: Array<ActionArgSpec> = []

    constructor(data: ActionSpec) {
        this.categoryCode = data['categoryCode']
        this.code = data['code']
        this.name = data['name']
        this.canFail = data['canFail']
        forEach(data['args'], (arg) => {
            this.args.push(new ActionArgSpec(arg))
        })
    }

    createAction(): Action {
        const action = new Action()

        action.code = this.code
        action.name = this.name
        forEach(this.args, (argSpec) => {
            const arg = new ActionArg()
            arg.id = argSpec.id
            arg.name = argSpec.name
            switch (argSpec.type) {
                case ActionTypeSpec.STRING:
                    arg.value = ''
                    break
                case ActionTypeSpec.BOOLEAN:
                    arg.value = false
                    break
                case ActionTypeSpec.INT:
                    arg.value = 0
                    break
                default:
                    arg.value = ''
                    break
            }
            action.args.push(arg)
        })

        action.actionSpec = this

        return action
    }
}
