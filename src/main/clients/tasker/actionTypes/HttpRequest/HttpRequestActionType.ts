import HttpRequestForm from './Components/HttpRequestForm.vue'
import { markRaw } from 'vue'
import BaseActionType from '../BaseActionType'
import type { ActiontypeFormComponent } from '../../ComponentTypes/ActiontypeFormComponent'
import Action from '../../types/Action'
import { MethodType } from './helpers/MethodType'
import HttpRequestParameters from './helpers/HttpRequestParameters'
import { forEach, split } from 'lodash'
import HttpSettings from './Components/HttpSettings.vue'
import { ActionTypeSupportedType } from '../../enums/ActionTypeSupportedType'

export default class HttpRequestActionType extends BaseActionType {
    markRawSettings = markRaw(HttpSettings)
    // base tasker configuration
    name: string = 'HTTP Request'
    tasker_code: number = 339
    tasker_name: string = 'HTTP Request'

    show_args: boolean = true
    content_height: string = '500px'
    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.CUSTOM

    // Parameters
    params: HttpRequestParameters = new HttpRequestParameters()

    constructor(action: Action) {
        super(action)

        this.params.method_type = this.action.args[0]?.value as MethodType
        if (this.action.args[1]?.value === 0) {
            this.params.url = ''
        } else {
            this.params.url = this.action.args[1]?.value as string
        }
        const headersQP = split(this.action.args[2]?.value as string, '\n')
        this.params.headers = []
        forEach(headersQP, (header) => {
            const splitHeader = split(header, ':')
            this.params.headers.push({ key: splitHeader[0], value: splitHeader[1] })
        })

        const splitQP = split(this.action.args[3]?.value as string, '\n')
        this.params.query_parameters = []
        forEach(splitQP, (param) => {
            const splitParam = split(param, ':')
            this.params.query_parameters.push({ key: splitParam[0], value: splitParam[1] })
        })
        this.params.body = this.action.args[4]?.value as string
        this.params.timeout = this.action.args[7]?.value as number
        this.params.trust_any_certificate = this.action.args[8]?.value as boolean
        this.params.follow_redirects = this.action.args[9]?.value as boolean
        this.params.use_cookies = this.action.args[10]?.value as boolean
        this.params.structure_output = this.action.args[11]?.value as boolean

        this.resetBothFormObjects()
    }

    canHandle(): boolean {
        // this is the default, if you don't plan on changing this you can remove this
        return this.action.code === this.tasker_code && this.action.name === this.tasker_name
    }

    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(HttpRequestForm)))
    }

    submitForm(): boolean {
        if (Object.prototype.hasOwnProperty.call(this.currentFormObject, 'method_type')) {
            this.params.method_type =
                (this.currentFormObject['method_type'] as MethodType) || MethodType.GET
        }
        if (Object.prototype.hasOwnProperty.call(this.currentFormObject, 'url')) {
            this.params.url = (this.currentFormObject['url'] as string) || ''
        }
        if (Object.prototype.hasOwnProperty.call(this.currentFormObject, 'headers')) {
            this.params.headers = []
            forEach(this.currentFormObject['headers'], (param) => {
                if (param.key && param.value)
                    this.params.headers.push({ key: param.key, value: param.value })
            })
        }
        if (Object.prototype.hasOwnProperty.call(this.currentFormObject, 'query_parameters')) {
            this.params.query_parameters = []
            forEach(this.currentFormObject['query_parameters'], (param) => {
                if (param.key && param.value)
                    this.params.query_parameters.push({ key: param.key, value: param.value })
            })
        }
        if (Object.prototype.hasOwnProperty.call(this.currentFormObject, 'body')) {
            this.params.body = (this.currentFormObject['body'] as string) || ''
        }
        return true
    }

    submitSettingsForm(): boolean {
        super.submitSettingsForm()
        this.params.timeout = (this.currentCustomSettingsFormObject['timeout'] as number) || 0
        this.params.trust_any_certificate =
            (this.currentCustomSettingsFormObject['trust_any_certificate'] as boolean) || false
        this.params.follow_redirects =
            (this.currentCustomSettingsFormObject['follow_redirects'] as boolean) || false
        this.params.use_cookies =
            (this.currentCustomSettingsFormObject['use_cookies'] as boolean) || false
        this.params.structure_output =
            (this.currentCustomSettingsFormObject['structure_output'] as boolean) || false

        this.setArgs()
        return true
    }

    buildFormObject(): object {
        if (!this.params) {
            return {}
        }
        return {
            method_type: this.params.method_type,
            url: this.params.url,
            headers: this.params.headers,
            query_parameters: this.params.query_parameters,
            body: this.params.body
        }
    }

    buildCustomSettingsFormObject(): object {
        if (!this.params) {
            return {}
        }

        return {
            timeout: this.params.timeout || 0,
            trust_any_certificate: this.params.trust_any_certificate || false,
            follow_redirects: this.params.follow_redirects || false,
            use_cookies: this.params.use_cookies || false,
            structure_output: this.params.structure_output || false
        }
    }

    setArgs(): void {
        forEach(this.action.args, (arg) => {
            if (arg.id == 1) {
                arg.value = this.params.method_type
            }
            if (arg.id == 2) {
                arg.value = this.params.url
            }
            if (arg.id == 3) {
                arg.value = ''
                forEach(this.params.headers, (header) => {
                    if (header.key && header.value) arg.value += `${header.key}:${header.value}\n`
                })
            }
            if (arg.id == 4) {
                arg.value = ''
                forEach(this.params.query_parameters, (param) => {
                    if (param.key && param.value) arg.value += `${param.key}:${param.value}\n`
                })
            }
            if (arg.id == 5) {
                arg.value = this.params.body
            }
            if (arg.id == 8) {
                arg.value = this.params.timeout
            }
            if (arg.id == 9) {
                arg.value = this.params.trust_any_certificate
            }
            if (arg.id == 10) {
                arg.value = this.params.follow_redirects
            }
            if (arg.id == 11) {
                arg.value = this.params.use_cookies
            }
            if (arg.id == 12) {
                arg.value = this.params.structure_output
            }
        })
    }

    static createNewAction(): HttpRequestActionType {
        const action = new Action()
        action.code = 339
        action.name = 'HTTP Request'
        action.args = [
            { id: 1, name: 'Method', value: MethodType.GET },
            { id: 2, name: 'URL', value: '' },
            { id: 3, name: 'Headers', value: '' },
            { id: 4, name: 'Query Parameters', value: '' },
            { id: 5, name: 'Body', value: '' },
            { id: 6, name: 'File', value: '' },
            { id: 7, name: 'Output File', value: '' },
            { id: 8, name: 'Timeout', value: 5 },
            { id: 9, name: 'Trust Any Certificate', value: false },
            { id: 10, name: 'Follow Redirects', value: true },
            { id: 11, name: 'Use Cookies', value: true },
            { id: 12, name: 'Structure Output', value: true }
        ]

        return new HttpRequestActionType(action)
    }
}
