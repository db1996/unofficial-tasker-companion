import { ActionTypeSupportedType } from '../enums/ActionTypeSupportedType'
import Action from '../types/Action'
import type { ActiontypeFormComponent } from '../ComponentTypes/ActiontypeFormComponent'
import { markRaw } from 'vue'
import DefaultForm from './default/DefaultForm.vue'
import { forEach } from 'lodash'
import type { SettingsFormComponent } from '../ComponentTypes/SettingsFormComponent'
import { ActionTypeSpec } from '../enums/ActionTypeSpec'

export default class BaseActionType {
    markRawSettings: unknown | null = null
    tasker_name: string = ''
    tasker_code: number = 0
    name: string = ''
    action: Action
    index: number = 0
    content_height: string = '500px'

    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.DEFAULT
    show_args: boolean = true
    description: string = ''

    currentFormObject: object = {}
    currentSettingsFormObject: object = {}
    currentCustomSettingsFormObject: object = {}

    // Always run this super in the constructor of the child class first. This will set the action and the tasker_name and tasker_code
    constructor(action: Action) {
        this.action = action
        this.tasker_name = action.name
        this.tasker_code = action.code

        this.resetBothFormObjects()
    }

    // If the action is supported by this type. By default it will check the tasker_code and tasker_name, the first actiontype to get recognized gets the job
    canHandle(): boolean {
        return this.action.code === this.tasker_code && this.action.name === this.tasker_name
    }

    // return a promise with the form component vue file
    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(DefaultForm)))
    }

    // Do not override this, this will build the form component entry, it is required to be ActiontypeFormComponent
    buildFormComponentEntry(markRawComponent: unknown): ActiontypeFormComponent {
        return {
            component: markRawComponent,
            props: { modelValue: this }
        }
    }

    // return a promise with the form component vue file
    getSettingsFormComponent(): Promise<SettingsFormComponent | null> {
        if (this.markRawSettings !== null) {
            return Promise.resolve(this.buildSettingsFormComponentEntry(this.markRawSettings))
        }
        return Promise.resolve(null)
    }

    // Do not override this, this will build the form component entry, it is required to be SettingsFormComponent
    buildSettingsFormComponentEntry(markRawComponent: unknown): SettingsFormComponent | null {
        return {
            component: markRawComponent,
            props: { modelValue: this }
        }
    }

    // Will be called when the form in the modal is submitted
    submitForm(): boolean {
        forEach(this.currentFormObject, (value, key) => {
            const expl = key.split('_')
            forEach(this.action.args, (arg) => {
                if (arg.id === parseInt(expl[1])) {
                    arg.value = value
                }
            })
        })
        return true
    }

    submitSettingsForm(): boolean {
        if (!this.currentSettingsFormObject['label']) {
            return false
        }

        this.action.label = this.currentSettingsFormObject['label'] as string
        return true
    }

    buildFormObject(): object {
        const formObject: Record<string, unknown> = {}

        forEach(this.action?.actionSpec?.args, (arg) => {
            forEach(this.action.args, (actionArg) => {
                if (actionArg.id === arg.id) {
                    formObject[`arg_${arg.id}`] = actionArg.value
                }
            })

            if (!formObject[`arg_${arg.id}`]) {
                switch (arg.type) {
                    case ActionTypeSpec.STRING:
                        formObject[`arg_${arg.id}`] = ''
                        break
                    case ActionTypeSpec.INT:
                        formObject[`arg_${arg.id}`] = 0
                        break
                    case ActionTypeSpec.BOOLEAN:
                        formObject[`arg_${arg.id}`] = false
                        break
                    default:
                        formObject[`arg_${arg.id}`] = null
                        break
                }
            }
        })
        return formObject
    }

    buildSettingsFormObject(): object {
        return {
            label: this.action.label || ''
        }
    }

    buildCustomSettingsFormObject(): object {
        return {}
    }

    updateFormObject(key: string, value: unknown) {
        if (this.currentFormObject[key] !== undefined) {
            this.currentFormObject[key] = value
        }
    }

    updateSettingsFormObject(key: string, value: unknown) {
        if (this.currentSettingsFormObject[key] !== undefined) {
            this.currentSettingsFormObject[key] = value
        }
    }

    updateCustomSettingsFormObject(key: string, value: unknown) {
        if (this.currentCustomSettingsFormObject[key] !== undefined) {
            this.currentCustomSettingsFormObject[key] = value
        }
    }

    resetBothFormObjects() {
        this.currentSettingsFormObject = this.buildSettingsFormObject()
        this.currentFormObject = this.buildFormObject()
        this.currentCustomSettingsFormObject = this.buildCustomSettingsFormObject()
    }

    // Will be called before saving the action, set all the args on this.actiontype.args here
    setArgs() {
        // This method should be overridden in child classes to set the args based on the action type
    }
}
