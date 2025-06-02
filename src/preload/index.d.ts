import { ElectronAPI } from '@electron-toolkit/preload'
import { ActualService } from '@main/clients/homeassistant/types/ActualService'
import { TaskerClientActivityStatus } from '@main/clients/tasker/enums/TaskerClientActivityStatus'
import Action from '@main/clients/tasker/types/Action'
import { AllSettings } from '@main/settings/types/AllSettings'
import { GeneralSettings } from '@main/settings/types/GeneralSettings'
import { HomeassistantSettings } from '@main/settings/types/HomeassistantSettings'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            getAllSettings: () => Promise<AllSettings>
            saveAllSettings: (settings: AllSettings) => Promise<void>
            chooseFolder: () => Promise<string>
            chooseFiles: () => Promise<string[]>
            chooseFolders: () => Promise<string[]>
            copy: (text: string) => Promise<boolean>
            saveTaskLabel: (index: number, label: string) => Promise<void>
            deleteTask: (index: number) => Promise<void>
            replaceAction: (index: number, action: Action) => Promise<void>
            moveTask: (fromIndex: number, toIndex: number) => Promise<void>
            settingsLoaded: (callback: (settings: AllSettings) => void) => void
            actionSpecsLoaded: (
                callback: (data: {
                    actionSpecs: ActionSpec[]
                    categorySpecs: CategorySpec[]
                }) => void
            ) => void
            taskerStatusUpdate: (
                callback: ({
                    connected: boolean,
                    errorStatus: TaskerErrorStatus,
                    clientActivityStatus: TaskerClientActivityStatus
                }) => void
            ) => void
            taskerGetStatus: () => Promise<{
                connected: boolean
                errorStatus: TaskerErrorStatus
                clientActivityStatus: TaskerClientActivityStatus
            }>
            taskerListActions: () => Promise<Action[]>
            taskerListActionSpecs: () => Promise<{
                actionSpecs: ActionSpec[]
                categorySpecs: CategorySpec[]
            }>
            homeassistantStatusUpdate: (
                callback: (status: HomeassistantStatus, error: string) => void
            ) => void
            homeassistantGetStatus: () => Promise<{
                homeassistantStatus: HomeassistantStatus
                error: string
            }>
            homeassistantListServicesFront: () => Promise<ActualService[]>
            homeassistantListEntities: () => Promise<HaEntity[]>
            homeassistantForceReload: () => Promise<{
                services: ActualService[]
                entities: HaEntity[]
            }>
            homeassistantCheckSettings: (settings: HomeassistantSettings) => Promise<void>
            taskerForceReload: () => Promise<{
                actionSpecs: ActionSpec[]
                categorySpecs: CategorySpec[]
            }>
            taskerCheckSettings: (settings: GeneralSettings) => Promise<void>
        }
    }
}
