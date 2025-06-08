import { shell, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { app } from 'electron'
import Settings from './settings/Settings'
import { AllSettings } from './settings/types/AllSettings'
import ncp from 'copy-paste'
import Action from './clients/tasker/types/Action'
import fs from 'fs'
import { HomeassistantStatus } from './clients/homeassistant/enums/HomeassistantStatus'
import { TaskerErrorStatus } from './clients/tasker/enums/taskerStoreError'
import { TaskerClientActivityStatus } from './clients/tasker/enums/TaskerClientActivityStatus'
import { HomeAssistantClient } from './clients/homeassistant/HomeAssistantClient'
import { HomeassistantSettings } from './settings/types/HomeassistantSettings'
import { GeneralSettings } from './settings/types/GeneralSettings'
import TaskerClient from './clients/tasker/TaskerClient'

let mainWindow: BrowserWindow | null = null
function createWindow(): void {
    // Create the browser window.
    const appIconWhite = nativeImage.createFromPath(
        join(__dirname, '../../resources/icon-white.png')
    )

    mainWindow = new BrowserWindow({
        // maximize
        width: 968,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        ...{},
        icon: appIconWhite,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        // mainWindow?.maximize()
        mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    mainWindow.webContents.openDevTools()

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    mainWindow.setThumbarButtons([
        {
            tooltip: 'Unofficial Tasker Companion',
            icon: appIconWhite,
            click() {
                console.log('button1 clicked')
            }
        }
    ])
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.unofficial-tasker-companion')
    let savedMyself = false

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    Settings.load(mainWindow)

    fs.watchFile(Settings.allSettingsPath, async () => {
        if (!savedMyself) {
            console.log('Settings file changed, reloading settings...')
            Settings.load()
        }
        savedMyself = false
    })

    ipcMain.handle('get-allsettings', () => {
        Settings.taskerClient?.updateFront()
        return Settings.allSettings
    })

    ipcMain.handle('choose-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        return result.filePaths[0]
    })

    ipcMain.handle('choose-files', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        })

        const ret: string[] = []
        for (const file of result.filePaths) {
            if (file !== undefined && file !== null && file !== '') {
                ret.push(file)
            }
        }
        return ret
    })

    ipcMain.handle('choose-folders', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'multiSelections']
        })

        const ret: string[] = []
        for (const file of result.filePaths) {
            if (file !== undefined && file !== null && file !== '') {
                ret.push(file)
            }
        }
        return ret
    })

    ipcMain.handle('tasker-list-actions', async () => {
        console.log('tasker-list-actions called')
        if (Settings.taskerDataPromise) {
            // Wait for the tasker data to be loaded before replacing the action
            await Settings.taskerDataPromise
        }

        let actions: Action[] = (await Settings.taskerClient?.getActions()) || []
        if (!actions) {
            actions = []
        }
        return actions
    })

    ipcMain.handle('save-task-label', async (_event, index: number, label: string) => {
        if (Settings.taskerClient) {
            if (Settings.taskerDataPromise) {
                // Wait for the tasker data to be loaded before replacing the action
                await Settings.taskerDataPromise
            }
            await Settings.taskerClient.saveLabel(index, label)
        }
    })

    ipcMain.handle('delete-task', async (_event, index: number) => {
        if (Settings.taskerClient) {
            if (Settings.taskerDataPromise) {
                // Wait for the tasker data to be loaded before replacing the action
                await Settings.taskerDataPromise
            }
            await Settings.taskerClient.deleteAction(index)
        }
    })

    ipcMain.handle('replace-action', async (_event, index: number, action: Action) => {
        if (Settings.taskerClient) {
            if (Settings.taskerDataPromise) {
                // Wait for the tasker data to be loaded before replacing the action
                await Settings.taskerDataPromise
            }
            console.log(JSON.stringify(action))
            await Settings.taskerClient.replaceAction(index, action)
        }
    })

    ipcMain.handle('create-action', async (_event, action: Action) => {
        if (Settings.taskerClient) {
            if (Settings.taskerDataPromise) {
                // Wait for the tasker data to be loaded before replacing the action
                await Settings.taskerDataPromise
            }
            await Settings.taskerClient.insertActionLast(action)
        }
    })

    ipcMain.handle('move-task', async (_event, fromIndex: number, toIndex: number) => {
        if (Settings.taskerClient) {
            if (Settings.taskerDataPromise) {
                // Wait for the tasker data to be loaded before replacing the action
                await Settings.taskerDataPromise
            }
            await Settings.taskerClient.moveAction(fromIndex, toIndex)
        }
    })

    ipcMain.handle('tasker-list-actionspecs', async () => {
        if (Settings.taskerDataPromise) {
            // Wait for the tasker data to be loaded before replacing the action
            await Settings.taskerDataPromise
        }
        return {
            actionSpecs: Settings.actionSpecs,
            categorySpecs: Settings.categorySpecs
        }
    })

    ipcMain.handle('tasker-get-status', async () => {
        if (Settings.taskerDataPromise) {
            // Wait for the tasker data to be loaded before replacing the action
            await Settings.taskerDataPromise
        }
        if (Settings.taskerClient) {
            return {
                connected: Settings.taskerClient.isConnected,
                errorStatus: Settings.taskerClient.error,
                clientActivityStatus: Settings.taskerClient.taskerclientActivityStatus
            }
        }

        return {
            connected: false,
            errorStatus: TaskerErrorStatus.NO_URL,
            clientActivityStatus: TaskerClientActivityStatus.NONE
        }
    })

    ipcMain.handle('homeassistant-get-status', async () => {
        if (Settings.homeassistantDataPromise) {
            // Wait for the homeassistant data to be loaded before replacing the action
            await Settings.homeassistantDataPromise
        }
        if (Settings.homeassistantClient) {
            return {
                homeassistantStatus: Settings.homeassistantClient.homeAssistantStatus,
                error: Settings.homeassistantClient.error
            }
        }

        return {
            homeassistantStatus: HomeassistantStatus.NO_SETTINGS,
            error: ''
        }
    })

    ipcMain.handle('homeassistant-list-entities', async () => {
        if (Settings.homeassistantDataPromise) {
            // Wait for the homeassistant data to be loaded before replacing the action
            await Settings.homeassistantDataPromise
        }
        if (Settings.homeassistantClient) {
            return await Settings.homeassistantClient.getEntities()
        }
        return []
    })

    ipcMain.handle('homeassistant-list-services-front', async () => {
        if (Settings.homeassistantDataPromise) {
            // Wait for the homeassistant data to be loaded before replacing the action
            await Settings.homeassistantDataPromise
        }
        if (Settings.homeassistantClient) {
            return await Settings.homeassistantClient.getServicesFront()
        }
        return []
    })

    ipcMain.handle('homeassistant-force-reload', async () => {
        if (Settings.homeassistantDataPromise) {
            // Wait for the homeassistant data to be loaded before replacing the action
            await Settings.homeassistantDataPromise
        }
        if (Settings.homeassistantClient) {
            await Settings.reloadHomeAssistant()
            return {
                services: await Settings.homeassistantClient.getServicesFront(),
                entities: await Settings.homeassistantClient.getEntities()
            }
        }
        return { services: [], entities: [] }
    })

    ipcMain.handle(
        'homeassistant-check-settings',
        async (_event, homeassistantSettings: HomeassistantSettings) => {
            const homeassistantClient = new HomeAssistantClient(
                homeassistantSettings.url,
                homeassistantSettings.token
            )

            await homeassistantClient.ping()
        }
    )

    ipcMain.handle('tasker-list-variables', async () => {
        if (Settings.taskerDataPromise) {
            // Wait for the tasker data to be loaded before replacing the action
            await Settings.taskerDataPromise
        }
        if (Settings.taskerClient) {
            return await Settings.taskerClient.getVariables()
        }
        return []
    })

    ipcMain.handle('tasker-force-reload', async () => {
        if (Settings.taskerDataPromise) {
            // Wait for the tasker data to be loaded before replacing the action
            await Settings.taskerDataPromise
        }
        if (Settings.taskerClient) {
            await Settings.reloadTasker()
            return {
                actionSpecs: await Settings.taskerClient.getActions(),
                categorySpecs: await Settings.taskerClient.getCategorySpecs()
            }
        }
        return [
            {
                actionSpecs: [],
                categorySpecs: []
            }
        ]
    })

    ipcMain.handle('tasker-check-settings', async (_event, taskerSettings: GeneralSettings) => {
        console.log('tasker-check-settings', taskerSettings)

        const taskerClient = new TaskerClient(taskerSettings.tasker_url)
        await taskerClient.pingTasker()
    })

    ipcMain.handle('save-allsettings', (_event, allSettings: AllSettings) => {
        savedMyself = true
        Settings.saveAllSettings(allSettings)
        Settings.load(mainWindow)
    })

    ipcMain.handle('copy', async (_event, text: string) => {
        try {
            ncp.copy(text)
            return true
        } catch (error) {
            return false
        }
    })

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
