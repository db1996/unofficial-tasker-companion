import Action from './types/Action'
import { TaskerErrorStatus } from './enums/taskerStoreError'
import { forEach } from 'lodash'
import type BaseActionType from './actionTypes/BaseActionType'
import { TaskerClientActivityStatus } from './enums/TaskerClientActivityStatus'
import ActionSpec from './types/specs/ActionSpec'
import type { CategorySpec } from './types/CategorySpec'
import type { Variable } from './types/Variable'
import Settings from '../../settings/Settings'

export default class TaskerClient {
    url: string = ''
    ping: boolean = false
    error: TaskerErrorStatus = TaskerErrorStatus.NONE
    taskerclientActivityStatus: TaskerClientActivityStatus = TaskerClientActivityStatus.NONE
    isConnected: boolean = false
    isRunning: boolean = false
    private getActionsQueue: (() => void)[] = []

    actionSpecs: Array<ActionSpec> = []
    categorySpecs: Array<CategorySpec> = []

    public constructor(url: string) {
        this.url = url

        if (this.url.length === 0) {
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_URL)
        }
        this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NONE)
    }

    // Generalized request function with retry and debounce/queue logic
    private requestQueue: { [key: string]: (() => void)[] } = {}
    private isRequesting: { [key: string]: boolean } = {}

    private async request<T>(key: string, fn: () => Promise<T>, retryCount = 0): Promise<T> {
        if (!this.requestQueue[key]) this.requestQueue[key] = []
        if (!this.isRequesting[key]) this.isRequesting[key] = false

        if (this.isRequesting[key]) {
            return new Promise((resolve) => {
                this.requestQueue[key].push(async () => {
                    const result = await this.request(key, fn)
                    resolve(result)
                })
            })
        }
        this.isRequesting[key] = true
        const startTime = Date.now()
        try {
            const result = await fn()
            return result
        } catch (e: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = e as any
            const elapsed = Date.now() - startTime
            const shouldRetry =
                retryCount < 3 &&
                elapsed <= 4000 && // Only retry if request took 4s or less
                (err?.code === 'ECONNRESET' ||
                    err?.message?.includes('fetch failed') ||
                    err?.message?.includes('network') ||
                    err?.cause?.code === 'ECONNRESET')
            if (shouldRetry) {
                console.warn(`${key} retrying (${retryCount + 1}/3) after throttle`)
                await new Promise((res) => setTimeout(res, 250))
                this.isRequesting[key] = false
                return this.request(key, fn, retryCount + 1)
            }
            throw err
        } finally {
            this.isRequesting[key] = false
            if (this.requestQueue[key].length > 0) {
                const next = this.requestQueue[key].shift()
                if (next) next()
            }
        }
    }

    async pingTasker(): Promise<void> {
        return this.request('pingTasker', async () => {
            this.ping = false
            this.isRunning = true
            this.isConnected = false
            this.updateStatus(TaskerClientActivityStatus.RETRIEVE, TaskerErrorStatus.NONE)
            const response = await fetch(this.url + '/ping')
            const text = await response.text()
            if (text !== '{}') {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
                this.isRunning = false
                this.ping = false
                throw new Error('Ping failed')
            }
            this.isRunning = false
            this.ping = true
            this.isConnected = true
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            console.log('TaskerClient pinged, status:', this.error)
        }).catch((error) => {
            console.error('Error pinging Tasker:', error)
            this.isRunning = false
            this.ping = false
            this.isConnected = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
        })
    }

    async getActionSpecs(): Promise<Array<ActionSpec>> {
        if (this.actionSpecs.length > 0) {
            console.log('Returning cached action specs:', this.actionSpecs.length)
            return this.actionSpecs
        }
        return this.request('getActionSpecs', async () => {
            this.isRunning = true
            this.updateStatus(TaskerClientActivityStatus.RETRIEVE)
            const response = await fetch(this.url + '/action_specs')
            const actionSpecsData: Array<object> = await response.json()
            this.isRunning = false
            if (!Array.isArray(actionSpecsData)) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
                return []
            }
            const actionSpecs: Array<ActionSpec> = actionSpecsData.map(
                (data) => new ActionSpec(data as ActionSpec)
            )
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            this.actionSpecs = actionSpecs
            console.log('Action specs loaded - backend:', actionSpecs.length)
            return actionSpecs
        })
    }

    async getCategorySpecs(): Promise<Array<CategorySpec>> {
        if (this.categorySpecs.length > 0) {
            console.log('Returning cached category specs:', this.categorySpecs.length)
            return this.categorySpecs
        }
        return this.request('getCategorySpecs', async () => {
            this.isRunning = true
            this.updateStatus(TaskerClientActivityStatus.RETRIEVE)
            const response = await fetch(this.url + '/category_specs')
            const categorySpecData: Array<object> = await response.json()
            this.isRunning = false
            if (!Array.isArray(categorySpecData)) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
                return []
            }
            const categorySpecs: Array<CategorySpec> = categorySpecData.map(
                (data) => data as CategorySpec
            )
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            this.categorySpecs = categorySpecs
            console.log('Category specs loaded:', categorySpecs.length)
            return categorySpecs ?? []
        })
    }

    updateFront() {
        Settings.mainWindow?.webContents.send('tasker-status-update', {
            connected: this.isConnected,
            errorStatus: this.error,
            clientActivityStatus: this.taskerclientActivityStatus
        })
    }

    async getVariables(): Promise<Array<Variable> | null> {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.RETRIEVE)
        try {
            const response = await fetch(this.url + '/variables')
            const categorySpecData: Array<object> = await response.json()

            this.isRunning = false
            if (!Array.isArray(categorySpecData)) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
                return null
            }

            const variables: Array<Variable> = categorySpecData.map((data) => data as Variable)

            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            return variables
        } catch (e) {
            console.log('error caught variables', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return null
        }
    }

    async getActions(retryCount = 0): Promise<Array<Action> | null> {
        if (this.isRunning) {
            // Queue the request and return the same promise
            return new Promise((resolve) => {
                this.getActionsQueue.push(async () => {
                    const result = await this.getActions()
                    resolve(result)
                })
            })
        }
        if (this.error !== TaskerErrorStatus.OK) {
            console.warn('getActions called but TaskerClient is not connected. Error:', this.error)
            return null
        }
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.RETRIEVE)
        try {
            const response = await fetch(this.url + '/actions')
            const actions: Array<Action> = await response.json()
            if (!Array.isArray(actions)) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
                this.isRunning = false
                return null
            }

            forEach(actions, (action, index) => {
                forEach(this.actionSpecs, (spec) => {
                    if (spec.code === action.code) {
                        action.actionSpec = spec
                    }
                })
                action.index = index
            })
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            // Process next in queue if any
            if (this.getActionsQueue.length > 0) {
                const next = this.getActionsQueue.shift()
                if (next) next()
            }
            return actions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            const shouldRetry =
                retryCount < 3 &&
                (e?.code === 'ECONNRESET' ||
                    e?.message?.includes('fetch failed') ||
                    e?.message?.includes('network') ||
                    e?.cause?.code === 'ECONNRESET')
            if (shouldRetry) {
                console.warn(`getActions retrying (${retryCount + 1}/3) after throttle`)
                await new Promise((res) => setTimeout(res, 250))
                this.isRunning = false
                return this.getActions(retryCount + 1)
            }
            console.error('error caught actions', e, 'URL:', this.url + '/actions')
            this.isRunning = false
            this.error = TaskerErrorStatus.NO_CONNECT
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            // Process next in queue if any
            if (this.getActionsQueue.length > 0) {
                const next = this.getActionsQueue.shift()
                if (next) next()
            }
            return null
        }
    }

    async moveAction(fromIndex: number, toIndex: number) {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.UPLOAD)
        const urlParams = new URLSearchParams({
            from: fromIndex.toString(),
            to: toIndex.toString()
        })
        const tUrl = this.buildUrl('/move', urlParams)
        const response = await fetch(tUrl, this.getOptions('GET'))

        try {
            const data = await response.json()
            forEach(data, (action) => {
                if (action.index === fromIndex) {
                    action.index = toIndex
                } else if (action.index === toIndex) {
                    action.index = fromIndex
                }
            })
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            return data
        } catch (e) {
            console.log('error caught moveAction', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return null
        }
    }

    async saveLabel(index: number, label: string) {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.UPLOAD)
        const urlParams = new URLSearchParams({
            index: index.toString(),
            value: label
        })
        const tUrl = this.buildUrl('/label', urlParams)
        const response = await fetch(tUrl, this.getOptions('GET'))

        try {
            const data = await response.json()
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            return data
        } catch (e) {
            console.log('error caught saveLabel', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return null
        }
    }

    async replaceAction(index: number, action: Action) {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.UPLOAD)

        const tUrl = this.buildUrl('/actions')
        const response = await fetch(tUrl, this.getOptions('PUT', { action: action, index: index }))

        try {
            const data = await response.json()
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            return data
        } catch (e) {
            console.log('error caught replaceAction', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return null
        }
    }

    async insertActionLast(actionType: BaseActionType) {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.UPLOAD)
        actionType.setArgs()

        const tUrl = this.buildUrl('/actions')
        const response = await fetch(
            tUrl,
            this.getOptions('PATCH', {
                action: actionType.action,
                index: actionType.index
            })
        )

        try {
            const data = await response.json()
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            return data
        } catch (e) {
            console.log('error caught insertActionLast', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return null
        }
    }

    async deleteAction(index: number): Promise<boolean> {
        this.isRunning = true
        this.updateStatus(TaskerClientActivityStatus.UPLOAD)
        try {
            const urlParams = new URLSearchParams({
                index: index.toString()
            })
            const tUrl = this.buildUrl('/delete', urlParams)
            const response = await fetch(tUrl, this.getOptions('GET'))
            if (response.status === 200) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
            } else {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            }
            this.isRunning = false
            return response.status === 200
        } catch (e) {
            console.log('error caught deleteAction', e)
            this.isRunning = false
            this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
            return false
        }
    }

    async replaceAllActions(actionsTypes: Array<BaseActionType>): Promise<boolean> {
        // loop through the actions and replace them one by one
        this.isRunning = true
        for (let i = 0; i < actionsTypes.length; i++) {
            const actionType = actionsTypes[i]
            const response = await this.replaceAction(actionType.index, actionType.action)
            if (response === null) {
                this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.NO_CONNECT)
                this.isRunning = false
                return false
            }
        }
        this.updateStatus(TaskerClientActivityStatus.NONE, TaskerErrorStatus.OK)
        this.isRunning = false
        return true
    }

    private updateStatus(status?: TaskerClientActivityStatus, error?: TaskerErrorStatus): void {
        if (status !== undefined) {
            this.taskerclientActivityStatus = status
        }
        if (error !== undefined) {
            this.error = error
        }
        this.updateFront()
    }

    public buildUrl(path: string, params: URLSearchParams | null = null): string {
        if (params) {
            return this.url + path + '?' + params.toString()
        }
        return this.url + path
    }

    public getOptions(fetchMethod = 'GET', body: object | null = null): RequestInit {
        const myHeaders = new Headers()
        let rawBody = ''

        const requestOptions: RequestInit = {
            method: fetchMethod,
            headers: myHeaders,
            redirect: 'follow'
        }

        if (body) {
            myHeaders.append('Content-Type', 'application/json')
            rawBody = JSON.stringify(body)

            requestOptions.body = rawBody
        }

        return requestOptions
    }
}
