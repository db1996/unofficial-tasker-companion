import { AllSettings } from '../../../main/settings/types/AllSettings'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref<AllSettings>({
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
    })

    let activeSettingsPromise: Promise<AllSettings> | null = null

    async function getSettings(): Promise<AllSettings> {
        if (!activeSettingsPromise && window.api) {
            activeSettingsPromise = window.api.getAllSettings()
            settings.value = await activeSettingsPromise
            activeSettingsPromise = null
            console.log('Settings loaded:', settings.value)
        }

        if (!settings.value) {
            return Promise.reject('Settings not loaded')
        } else {
            return settings.value
        }
    }

    async function saveSettings(newSettings: AllSettings) {
        console.log('Saving settings json', JSON.stringify(newSettings))

        await window.api?.saveAllSettings(JSON.parse(JSON.stringify(newSettings)))
        settings.value = JSON.parse(JSON.stringify(newSettings))
    }

    return {
        settings,
        saveSettings,
        getSettings
    }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
