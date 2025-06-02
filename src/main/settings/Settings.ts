import path from 'node:path'
import { AllSettings } from './types/AllSettings'
import { app } from 'electron'
import fs from 'fs'
import TaskerClient from '../clients/tasker/TaskerClient'
import { TaskerErrorStatus } from '../clients/tasker/enums/taskerStoreError'
import ActionSpec from '../clients/tasker/types/specs/ActionSpec'
import { CategorySpec } from '../clients/tasker/types/CategorySpec'
import { HomeAssistantClient } from '../clients/homeassistant/HomeAssistantClient'
import { HomeassistantStatus } from '../clients/homeassistant/enums/HomeassistantStatus'

export default class Settings {
    static allSettingsPath = path.join(app.getPath('userData'), 'settings.json')

    static fileExists = false

    static mainWindow: Electron.BrowserWindow | null = null

    static taskerClient: TaskerClient | null = null

    static homeassistantClient: HomeAssistantClient | null = null

    static allSettings: AllSettings = {
        general: {
            tasker_url: ''
        },
        homeassistant: {
            active: false,
            url: '',
            token: '',
            replace_url_var: '%HASS_server',
            replace_token_var: '%HASS_access_token'
        }
    }

    static actionSpecs: ActionSpec[] = []
    static categorySpecs: CategorySpec[] = []
    static taskerDataPromise: Promise<void> | null = null
    static homeassistantDataPromise: Promise<void> | null = null

    static async reloadTasker() {
        if (!Settings.taskerDataPromise) {
          Settings.taskerDataPromise = (async () => {
                if (!Settings.allSettings.general.tasker_url) {
                    // If Tasker URL is not set, do not proceed with loading data
                    console.log('Tasker URL is not set, skipping data load.')
                    Settings.mainWindow?.webContents.send('tasker-status-update', {
                        taskerStatus: TaskerErrorStatus.NO_URL,
                        error: ''
                    })
                    return
                }
                Settings.taskerClient = new TaskerClient(Settings.allSettings.general.tasker_url)
                const client = Settings.taskerClient
                if (!client) return

                await client.pingTasker()
                if (client.error === TaskerErrorStatus.OK && client.isConnected) {
                    Settings.actionSpecs = await client.getActionSpecs()
                    Settings.categorySpecs = await client.getCategorySpecs()
                }
            })().finally(() => {
                Settings.taskerDataPromise = null
            })
        }
    }

    static async reloadHomeAssistant() {
        if (!Settings.homeassistantDataPromise) {
            Settings.homeassistantDataPromise = (async () => {
                if (!Settings.allSettings.homeassistant.active) {
                    // If Home Assistant is not active, do not proceed with loading data
                    console.log('Home Assistant is not active, skipping data load.')
                    Settings.mainWindow?.webContents.send('homeassistant-status-update', {
                        homeassistantStatus: HomeassistantStatus.NO_SETTINGS,
                        error: ''
                    })
                    return
                }
                Settings.homeassistantClient = new HomeAssistantClient(
                    Settings.allSettings.homeassistant.url,
                    Settings.allSettings.homeassistant.token
                )
                const client = Settings.homeassistantClient
                if (!client) return
                await client.ping()
                if (
                    client.error.length === 0 &&
                    client.homeAssistantStatus === HomeassistantStatus.CONNECTED
                ) {
                    await client.getServicesFront()
                    await client.getEntities()
                }
            })().finally(() => {
                Settings.homeassistantDataPromise = null
            })
        }
    }

    static async load(mainWindow: Electron.BrowserWindow | null = null) {
        if (mainWindow !== null) {
            Settings.mainWindow = mainWindow
        }

        if (!fs.existsSync(Settings.allSettingsPath)) {
            // If the settings file does not exist, create it with default settings
            Settings.saveAllSettings(Settings.allSettings)
        }

        // Load settings from
        if (fs.existsSync(Settings.allSettingsPath)) {
            const settings = fs.readFileSync(Settings.allSettingsPath, 'utf-8')
            try {
                Settings.allSettings = JSON.parse(settings)
                Settings.mainWindow?.webContents.send('settings-loaded', Settings.allSettings)
                Settings.reloadTasker()
                Settings.reloadHomeAssistant()
            } catch (error) {
                console.error('Error parsing settings file', error)
            }
        }
    }

    static sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    static saveAllSettings(allSettings: AllSettings) {
        Settings.allSettings = allSettings
        // Save settings to disk
        fs.writeFileSync(Settings.allSettingsPath, JSON.stringify(Settings.allSettings, null, 4))
    }
}
