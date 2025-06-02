import { markRaw } from 'vue'
import BaseActionType from '../../tasker/actionTypes/BaseActionType'
import type { ActiontypeFormComponent } from '../../tasker/ComponentTypes/ActiontypeFormComponent'
import Action from '../../tasker/types/Action'
import { MethodType } from '../../tasker/actionTypes/HttpRequest/helpers/MethodType'
import HttpRequestParameters from '../../tasker/actionTypes/HttpRequest/helpers/HttpRequestParameters'
import { forEach, split } from 'lodash'
import HomeassistantEdit from './HomeassistantEdit.vue'
import HttpSettings from '../../tasker/actionTypes/HttpRequest/Components/HttpSettings.vue'
import { ActionTypeSupportedType } from '../../tasker/enums/ActionTypeSupportedType'
import ServiceData from '../types/ServiceData'

import { useSettingsStore } from '../../../../renderer/src/stores/settings.store'

export default class HomeassistantAction extends BaseActionType {
    markRawSettings = markRaw(HttpSettings)
    // base tasker configuration
    name: string = 'HTTP Request'
    tasker_code: number = 339
    tasker_name: string = 'HTTP Request'

    show_args: boolean = true
    content_height: string = '500px'
    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.PLUGIN
    serviceData: ServiceData = new ServiceData()
    settingsStore = useSettingsStore()

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

        this.serviceData = this.urlToServiceData(this.params.url, JSON.parse(this.params.body))

        this.resetBothFormObjects()
    }

  canHandle(): boolean {
        if (this.action.code === this.tasker_code && this.action.name === this.tasker_name) {
            if (
                this.params.method_type === MethodType.POST &&
                ((this.settingsStore.settings.homeassistant.replace_url_var !== '' &&
                    this.params.url.startsWith(
                        this.settingsStore.settings.homeassistant.replace_url_var
                    )) ||
                    this.params.url.startsWith(this.settingsStore.settings.homeassistant.url))
            ) {
                const body = JSON.parse(this.params.body)
                this.serviceData = this.urlToServiceData(this.params.url, body)
                this.currentFormObject = this.buildFormObject()
                this.currentSettingsFormObject = this.buildSettingsFormObject()

                return true
            }
        }
        return false
    }

    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(HomeassistantEdit)))
    }

    submitForm(): boolean {
        this.serviceData.domain = this.currentFormObject['domain']
        this.serviceData.service = this.currentFormObject['service']
        this.serviceData.entity_id = this.currentFormObject['entity_id']

        if (this.currentFormObject['dataContainer'] !== undefined) {
            this.serviceData.data = {}
            if (this.serviceData.data !== null) {
                forEach(this.currentFormObject['dataContainer'], (value, key) => {
                    if (value.toggle && this.serviceData.data !== null) {
                        this.serviceData.data[key] = value.value
                    }
                })
            }
        }

        return true
    }

    submitSettingsForm(): boolean {
        super.submitSettingsForm()
        this.params.timeout = this.currentSettingsFormObject['timeout'] as number
        this.params.trust_any_certificate = this.currentSettingsFormObject[
            'trust_any_certificate'
        ] as boolean
        this.params.follow_redirects = this.currentSettingsFormObject['follow_redirects'] as boolean
        this.params.use_cookies = this.currentSettingsFormObject['use_cookies'] as boolean
        this.params.structure_output = this.currentSettingsFormObject['structure_output'] as boolean

        console.log('Updated parameters:', this.params)
        this.setArgs()
        return true
    }

    buildFormObject(): object {
        if (!this.serviceData) {
            return {}
        }
        let dataContainer: Record<string, { toggle: boolean; value: string }> = {}
        if (this.serviceData.data !== null) {
            dataContainer = {}
            forEach(this.serviceData.data, (value, key) => {
                dataContainer[key] = {
                    toggle: true,
                    value: value as string
                }
            })
        }
        return {
            domain: this.serviceData.domain || '',
            service: this.serviceData.service || '',
            entity_id: this.serviceData.entity_id || '',
            dataContainer: dataContainer
        }
    }

    updateDataContainerValue(key: string, value: string): void {
        if (this.currentFormObject['dataContainer']) {
            if (!this.currentFormObject['dataContainer'][key]) {
                this.currentFormObject['dataContainer'][key] = { toggle: false, value: '' }
            }
            this.currentFormObject['dataContainer'][key].value = value
        }
    }

    updateDataContainerToggle(key: string, toggle: boolean): void {
        if (this.currentFormObject['dataContainer']) {
            if (!this.currentFormObject['dataContainer'][key]) {
                this.currentFormObject['dataContainer'][key] = { toggle: false, value: '' }
            }
            this.currentFormObject['dataContainer'][key].toggle = toggle
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
        const url = this.buildUrl(
            '/api/services/' + this.serviceData.domain + '/' + this.serviceData.service
        )

        this.setHeaders()

        this.params.url = url
        this.params.method_type = MethodType.POST
        const data: Record<string, string | Array<unknown>> = {}
        if (this.serviceData.entity_id !== '' && this.serviceData.entity_id !== null) {
            data['entity_id'] = this.serviceData.entity_id
        }
        if (this.serviceData.data !== null) {
            forEach(this.serviceData.data, (value, key) => {
                data[key] = value as string
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const convertedValue: any = JSON.parse(value) ?? null
                    const arValues = convertedValue as number[] | string[]

                    if (arValues !== null && arValues.length > 0) {
                        data[key] = arValues
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    // If parsing fails, keep the original value
                    data[key] = value
                }
            })
        }
        this.params.body = JSON.stringify(data)
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

    setHeaders() {
        this.params.headers = [
            {
                key: 'Authorization',
                value:
                    'Bearer ' +
                    (this.settingsStore.settings.homeassistant.replace_token_var ||
                        this.settingsStore.settings.homeassistant.token)
            }
        ]
    }

    urlToServiceData(url: string, body: object | null = null): ServiceData {
        const urlServiceData = new ServiceData()

        if (
            !url.startsWith(this.settingsStore.settings.homeassistant.replace_url_var) &&
            !url.startsWith(this.settingsStore.settings.homeassistant.url)
        ) {
            return urlServiceData
        }

        url.replace(
            this.settingsStore.settings.homeassistant.replace_url_var,
            this.settingsStore.settings.homeassistant.url
        )

        url = url.replace('http://', '').replace('https://', '')

        const urlParts = url.split('/')
        urlServiceData.baseUrl = urlParts[0]

        if (urlParts.length >= 3) {
            urlServiceData.apiActionUrl = urlParts[1] + '/' + urlParts[2]
            if (urlParts[2] === 'services' && urlParts.length >= 5) {
                urlServiceData.is_service = true
                urlServiceData.domain = urlParts[3]
                urlServiceData.service = urlParts[4]

                if (body !== null) {
                    const data: Record<string, string> = {}

                    forEach(body, (value, key) => {
                        if (key === 'entity_id') {
                            urlServiceData.entity_id = value
                        } else {
                            if (typeof value === 'string') {
                                data[key] = value
                            } else {
                                data[key] = JSON.stringify(value)
                            }
                        }
                    })

                    if (Object.keys(data).length > 0) urlServiceData.data = data
                }
            }
        }

        return urlServiceData
    }

    public buildUrl(path: string, params: URLSearchParams | null = null): string {
        if (params) {
            return this.settingsStore.settings.homeassistant.url + path + '?' + params.toString()
        }
        return this.settingsStore.settings.homeassistant.url + path
    }

    static createNewAction(): HomeassistantAction {
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

        return new HomeassistantAction(action)
    }
}
