import { ActionTypeSpec } from '../../enums/ActionTypeSpec'

export default class ActionArgSpec {
    public id: number = 0
    public name: string = ''
    public type: ActionTypeSpec = ActionTypeSpec.STRING
    public isMandatory: boolean = false
    public sortOrder: string = ''
    public spec: string = ''

    constructor(data: ActionArgSpec) {
        this.id = data['id']
        this.name = data['name']
        this.type = data['type']
        this.isMandatory = data['isMandatory'] || false
        this.sortOrder = data['sortOrder'] || ''
        this.spec = data['spec'] || ''
    }
}
