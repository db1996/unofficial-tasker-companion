import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { AllSettings } from '../main/settings/types/AllSettings'
import { TaskerErrorStatus } from '../main/clients/tasker/enums/taskerStoreError'
import { TaskerClientActivityStatus } from '../main/clients/tasker/enums/TaskerClientActivityStatus'
import Action from '../main/clients/tasker/types/Action'
import ActionSpec from '../main/clients/tasker/types/specs/ActionSpec'
import { CategorySpec } from '../main/clients/tasker/types/CategorySpec'
import { HaEntity } from '../main/clients/homeassistant/types/HaEntity'
import { HomeassistantStatus } from '../main/clients/homeassistant/enums/HomeassistantStatus'
import { ActualService } from '../main/clients/homeassistant/types/ActualService'
import { HomeassistantSettings } from '../main/settings/types/HomeassistantSettings'
import { GeneralSettings } from '../main/settings/types/GeneralSettings'
import { Variable } from '../main/clients/tasker/types/Variable'

declare global {
    interface Window {
        api?: typeof api
        electron?: typeof electronAPI
    }
}

// Custom APIs for renderer
const api = {
    // Add your custom APIs here
    // For example:
    // openDialog: () => electronAPI.dialog.showOpenDialog({ properties: ['openFile'] })
    getAllSettings: () => electronAPI.ipcRenderer.invoke('get-allsettings'),
    saveAllSettings: async (settings: AllSettings) =>
        await electronAPI.ipcRenderer.invoke('save-allsettings', settings),
    chooseFolder: () => electronAPI.ipcRenderer.invoke('choose-folder'),
    chooseFiles: () => electronAPI.ipcRenderer.invoke('choose-files'),
    chooseFolders: () => electronAPI.ipcRenderer.invoke('choose-folders'),
    copy: async (text: string) => electronAPI.ipcRenderer.invoke('copy', text),
    saveTaskLabel: async (index: number, label: string) =>
        electronAPI.ipcRenderer.invoke('save-task-label', index, label),
    deleteTask: async (index: number) => electronAPI.ipcRenderer.invoke('delete-task', index),
    replaceAction: async (index: number, action: Action) =>
        electronAPI.ipcRenderer.invoke('replace-action', index, action),
    createAction: async (action: Action) => electronAPI.ipcRenderer.invoke('create-action', action),
    moveTask: async (fromIndex: number, toIndex: number) =>
        electronAPI.ipcRenderer.invoke('move-task', fromIndex, toIndex),
    settingsLoaded: (callback: (arg0: AllSettings) => void) =>
        electronAPI.ipcRenderer.on('settings-loaded', (_, data: AllSettings) => callback(data)),
    actionSpecsLoaded: (
        callback: (arg0: { actionSpecs: ActionSpec[]; categorySpecs: CategorySpec[] }) => void
    ) =>
        electronAPI.ipcRenderer.on(
            'action-specs-loaded',
            (_, data: { actionSpecs: ActionSpec[]; categorySpecs: CategorySpec[] }) =>
                callback(data)
        ),
    taskerStatusUpdate: (
        callback: (arg0: {
            connected: boolean
            errorStatus: TaskerErrorStatus
            clientActivityStatus: TaskerClientActivityStatus
        }) => void
    ) =>
        electronAPI.ipcRenderer.on(
            'tasker-status-update',
            (
                _,
                data: {
                    connected: boolean
                    errorStatus: TaskerErrorStatus
                    clientActivityStatus: TaskerClientActivityStatus
                }
            ) => callback(data)
        ),
    reloadSettings: (callback: () => void) =>
        electronAPI.ipcRenderer.on('reload-settings', () => callback()),
    taskerGetStatus: () =>
        electronAPI.ipcRenderer.invoke('tasker-get-status') as Promise<{
            connected: boolean
            errorStatus: TaskerErrorStatus
            clientActivityStatus: TaskerClientActivityStatus
        }>,
    taskerListVariables: () =>
        electronAPI.ipcRenderer.invoke('tasker-list-variables') as Promise<Variable[]>,
    taskerListActions: () =>
        electronAPI.ipcRenderer.invoke('tasker-list-actions') as Promise<Action[]>,
    taskerListActionSpecs: () =>
        electronAPI.ipcRenderer.invoke('tasker-list-actionspecs') as Promise<{
            actionSpecs: ActionSpec[]
            categorySpecs: CategorySpec[]
        }>,
    homeassistantStatusUpdate: (
        callback: (arg0: { homeassistantStatus: HomeassistantStatus; error: string }) => void
    ) =>
        electronAPI.ipcRenderer.on(
            'homeassistant-status-update',
            (_, data: { homeassistantStatus: HomeassistantStatus; error: string }) => callback(data)
        ),
    homeassistantGetStatus: () =>
        electronAPI.ipcRenderer.invoke('homeassistant-get-status') as Promise<{
            homeassistantStatus: HomeassistantStatus
            error: string
        }>,
    homeassistantListEntities: () =>
        electronAPI.ipcRenderer.invoke('homeassistant-list-entities') as Promise<HaEntity[]>,
    homeassistantListServicesFront: () =>
        electronAPI.ipcRenderer.invoke('homeassistant-list-services-front') as Promise<
            ActualService[]
        >,
    homeassistantForceReload: () =>
        electronAPI.ipcRenderer.invoke('homeassistant-force-reload') as Promise<{
            services: ActualService[]
            entities: HaEntity[]
        }>,
    homeassistantCheckSettings: (settings: HomeassistantSettings) =>
        electronAPI.ipcRenderer.invoke('homeassistant-check-settings', settings) as Promise<void>,
    taskerCheckSettings: (settings: GeneralSettings) =>
        electronAPI.ipcRenderer.invoke('tasker-check-settings', settings) as Promise<void>,
    taskerForceReload: () =>
        electronAPI.ipcRenderer.invoke('tasker-force-reload') as Promise<{
            actionSpecs: ActionSpec[]
            categorySpecs: CategorySpec[]
        }>
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('ipcRenderer', {
            minimize: () => electronAPI.ipcRenderer.send('minimize')
        })
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}
