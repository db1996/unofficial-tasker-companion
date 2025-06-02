import * as homeassistant from '@brittonhayes/homeassistant-ts'
import type { HaEntity } from './types/HaEntity'
import type { HaDomainService } from './types/HaDomainService'
import { forEach } from 'lodash'
import type { HaService } from './types/HaService'
import type { ActualService } from './types/ActualService'
import type { HaServiceField } from './types/HaServiceField'
import { HaServiceFieldType } from './enums/HaServiceFieldType'
import { HomeassistantStatus } from './enums/HomeassistantStatus'
import Settings from '../../settings/Settings'

export class HomeAssistantClient {
    public client: homeassistant.Client | null = null
    public baseUrl: string = ''
    public accessToken: string = ''
    public error: string = ''
    public homeAssistantStatus: HomeassistantStatus = HomeassistantStatus.NO_SETTINGS
    public isRunning: boolean = false

    private services: HaDomainService[] = []
    private entities: HaEntity[] = []

    public constructor(baseUrl: string = '', accessToken: string = '') {
        this.baseUrl = baseUrl
        this.accessToken = accessToken

        this.createClient()
    }

    private createClient(): void {
        this.homeAssistantStatus = HomeassistantStatus.CONNECTING

        if (this.baseUrl.length === 0 && this.accessToken.length === 0) {
            this.homeAssistantStatus = HomeassistantStatus.NO_URL_AND_TOKEN
        }else if (this.baseUrl.length === 0) {
            this.homeAssistantStatus = HomeassistantStatus.NO_URL
        }else if (this.accessToken.length === 0) {
            this.homeAssistantStatus = HomeassistantStatus.NO_TOKEN
        }

        if (this.homeAssistantStatus !== HomeassistantStatus.CONNECTING) {
            this.updateFront()
            return
        }

        const client = new homeassistant.Client({
            baseUrl: this.baseUrl,
            token: this.accessToken
        })

        this.client = client
    }

    public async ping(): Promise<boolean> {
        if (this.isRunning) {
            return false
        }

        if (this.client === null) {
            return false
        }
        this.error = ''
        this.isRunning = true

        try {
            const result = await this.client.health.retrieve()

            if (result.status !== 200) {
                this.homeAssistantStatus = HomeassistantStatus.NO_CONNECTION
                this.isRunning = false
                if (result.data.message) {
                    this.error = result.data.message
                }
                if (result.status === 401) {
                    this.error = 'Unauthorized, check your access token'
                }
                this.updateFront()

                return false
            }
        } catch (error) {
            this.isRunning = false
            if (error) {
                this.updateFront(
                    HomeassistantStatus.NO_CONNECTION,
                    "Can't connect to Home Assistant, error: " + error
                )
            }
            return false
        }

        this.isRunning = false
        this.updateFront(HomeassistantStatus.CONNECTED, '')

        return true
    }

    public async getEntities(): Promise<HaEntity[]> {
        if (this.homeAssistantStatus !== HomeassistantStatus.CONNECTED || this.client === null) {
            return []
        }

        if (this.entities.length > 0) {
            return this.entities
        }

        this.isRunning = true
        const response = await this.client.states.list()
        const entities: HaEntity[] = response.data

        this.isRunning = false
        if (!entities) return []

        this.entities = entities
        return entities
    }

    public async getServices(force: boolean = false): Promise<HaDomainService[]> {
        if (this.homeAssistantStatus !== HomeassistantStatus.CONNECTED || this.client === null) {
            console.error('Home Assistant client is not connected or initialized.')
            return []
        }

        if (this.services.length > 0 && !force) {
            return this.services
        }

        this.isRunning = true
        try {
            const data = await this.client.services.list()
            console.log('Retrieved services from Home Assistant:', data.data.length)
            const convertedData: HaDomainService[] = data.data as HaDomainService[]
            this.services = convertedData
            this.isRunning = false
            return this.services
        } catch (error) {
            this.isRunning = false
            this.updateFront(
                HomeassistantStatus.NO_CONNECTION,
                "Can't retrieve services from Home Assistant, error: " + error
            )
            console.error('Error retrieving services:', error)
            return []
        }
    }

    public async getServicesFront(force: boolean = false): Promise<ActualService[]> {
        if (this.homeAssistantStatus !== HomeassistantStatus.CONNECTED || this.client === null) {
            return []
        }

        const services = await this.getServices(force)
        const actualServices: ActualService[] = []
        for (const service of services) {
            forEach(service.services, (serviceData, serviceId) => {
                const actualService = this.convertService(
                    serviceData,
                    serviceId.toString(),
                    service.domain || ''
                )
                actualServices.push(actualService)
            })
        }

        if (actualServices.length === 0) {
            this.updateFront(
                HomeassistantStatus.NO_CONNECTION,
                'No services found in Home Assistant'
            )
            console.log(services.length, actualServices.length)
            return []
        }
        return actualServices
    }

    private convertService(HaService: HaService, serviceId: string, domain: string): ActualService {
        const hasEntityTarget =
            (HaService.target && HaService.target['entity'] !== undefined) || false
        const actualService = {
            id: serviceId.toString(),
            name: HaService.name,
            description: HaService.description,
            type: domain,
            domain: domain,
            fields: [] as HaServiceField[],
            targetEntity: hasEntityTarget
        }

        if (HaService.fields !== undefined) {
            forEach(HaService.fields, (field, index) => {
                if (index.toString() !== 'advanced_fields') {
                    const fieldData = this.convertField(field, index.toString())

                    if (fieldData !== null) {
                        actualService.fields.push(fieldData)
                    }
                }
            })
        }

        return actualService
    }

    private convertField(field: Record<string, unknown>, id: string): HaServiceField | null {
        const fieldData: HaServiceField = {
            id: id
        }

        if (field.name !== undefined) {
            fieldData.name = field.name as string
        }
        if (field.description !== undefined) {
            fieldData.description = field.description as string
        }
        if (field.required !== undefined) {
            fieldData.required = field.required as boolean
        }
        if (field.example !== undefined) {
            fieldData.example = field.example as string
        }

        if (fieldData.id == 'date' || fieldData.id == 'time' || fieldData.id == 'datetime') {
            fieldData.type = fieldData.id as HaServiceFieldType
        } else {
            if (field.selector !== undefined && field.type === undefined) {
                const selector = field.selector as Record<string, unknown>

                forEach(HaServiceFieldType, (value) => {
                    if (selector[value] !== undefined) {
                        const selectorValue = selector[value] as Record<string, unknown>

                        switch (value) {
                            case 'text':
                            case 'boolean':
                                fieldData.type = value
                                break
                            case 'entity':
                                fieldData.type = HaServiceFieldType.TEXT
                                break
                            case 'select':
                                fieldData.type = HaServiceFieldType.SELECT
                                fieldData.options = []
                                if (selectorValue !== null) {
                                    if (selectorValue.options !== undefined) {
                                        forEach(
                                            selectorValue.options,
                                            (option: string | { label: string; value: string }) => {
                                                if (typeof option === 'string') {
                                                    fieldData.options?.push({
                                                        label: option,
                                                        value: option
                                                    })
                                                } else {
                                                    fieldData.options?.push({
                                                        label: option.label as string,
                                                        value: option.value as string
                                                    })
                                                }
                                            }
                                        )
                                    }
                                }
                                break
                            case 'color_temp':
                            case 'color_rgb':
                            case 'number':
                                if (fieldData.type === undefined) {
                                    fieldData.type = HaServiceFieldType.NUMBER
                                }

                                if (selectorValue !== null) {
                                    if (selectorValue.min !== undefined) {
                                        fieldData.min = selectorValue.min as number
                                    }

                                    if (selectorValue.max !== undefined) {
                                        fieldData.max = selectorValue.max as number
                                    }

                                    if (selectorValue.unit_of_measurement !== undefined) {
                                        fieldData.unit_of_measurement =
                                            selectorValue.unit_of_measurement as string
                                    }
                                    if (selectorValue.unit !== undefined) {
                                        fieldData.unit_of_measurement = selectorValue.unit as string
                                    }
                                }

                                break
                        }
                    }
                })
            }
        }

        if (fieldData.type !== undefined) {
            return fieldData
        }

        return null
    }

    public async CallService(
        domain: string,
        service: string,
        entity_id: string,
        data: object | null = null
    ): Promise<boolean> {
        if (this.homeAssistantStatus !== HomeassistantStatus.CONNECTED || this.client === null) {
            throw new Error(this.error)
        }
        this.isRunning = true

        const url = this.buildUrl('/api/services/' + domain + '/' + service)

        let body = { entity_id: entity_id }
        if (data) {
            body = { ...body, ...data }
        }

        const options = this.getOptions('POST', body)

        return await fetch(url, options)
            .then((res) => {
                this.isRunning = false
                if (!res.ok) {
                    this.error = res.statusText
                    if (res.status === 401) {
                        this.error = 'Unauthorized, check your access token'
                    }
                    this.updateFront(HomeassistantStatus.NO_CONNECTION)
                    return false
                } else {
                    this.updateFront(HomeassistantStatus.CONNECTED, '')

                    return true
                }
            })
            .catch((err) => {
                this.isRunning = false
                this.updateFront(HomeassistantStatus.NO_CONNECTION, err.toString())
                return false
            })
    }

    public buildUrl(path: string, params: URLSearchParams | null = null): string {
        if (params) {
            return this.baseUrl + path + '?' + params.toString()
        }
        return this.baseUrl + path
    }

    public getOptions(fetchMethod = 'GET', body: object | null = null): RequestInit {
        const headers = new Headers()
        headers.append('Authorization', 'Bearer ' + this.accessToken)
        let rawBody = ''

        const requestOptions: RequestInit = {
            method: fetchMethod,
            headers: headers,
            redirect: 'follow'
        }

        if (body) {
            headers.append('Content-Type', 'application/json')
            rawBody = JSON.stringify(body)

            requestOptions.body = rawBody
        }

        return requestOptions
    }

    private updateFront(homeassistantStatus?: HomeassistantStatus, error?: string): void {
        if (homeassistantStatus !== undefined) {
            this.homeAssistantStatus = homeassistantStatus
        }
        if (error !== undefined) {
            this.error = error
        }

        console.log('Updating Home Assistant status in the front end:', {
            homeassistantStatus: this.homeAssistantStatus,
            error: this.error
        })

        Settings.mainWindow?.webContents.send('homeassistant-status-update', {
            homeassistantStatus: this.homeAssistantStatus,
            error: this.error
        })
    }
}
