import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { HomeassistantStatus } from '../../../main/clients/homeassistant/enums/HomeassistantStatus'
import { HaDomainService } from '../../../main/clients/homeassistant/types/HaDomainService'
import { HaEntity } from '../../../main/clients/homeassistant/types/HaEntity'
import { ActualService } from '../../../main/clients/homeassistant/types/ActualService'
import { HomeassistantSettings } from '../../../main/settings/types/HomeassistantSettings'

export const useHomeassistantStore = defineStore('homeassistant', () => {
    const homeassistantStatus = ref<HomeassistantStatus>(HomeassistantStatus.BOOTING)
    const homeassistantError = ref<string>('')

    const isBooting = ref<boolean>(true)
    const content_height = '300px'

    const services = ref<HaDomainService[]>([])
    const entities = ref<HaEntity[]>([])
    const servicesFront = ref<ActualService[]>([])

    const isRetrievingData = ref<boolean>(false)
    init()

    watch(
        homeassistantStatus,
        (newStatus) => {
            if (newStatus === HomeassistantStatus.CONNECTED) {
                console.log('Homeassistant connected, retrieving data...')
                init()
            }
        },
        { immediate: true }
    )

    const homeassistantStatusProperties = computed(() => {
        const ret = {
            text: 'Booting...',
            text_class: 'secondary',
            icon: 'clock',
            spin: false
        }
        switch (homeassistantStatus.value) {
            case HomeassistantStatus.BOOTING:
                ret.text = 'Booting...'
                ret.text_class = 'secondary'
                ret.icon = 'clock'
                break
            case HomeassistantStatus.CONNECTING:
                ret.text = 'Connecting...'
                ret.text_class = 'secondary'
                ret.icon = 'clock'
                break
            case HomeassistantStatus.NO_SETTINGS:
                ret.text = 'No settings'
                ret.text_class = 'secondary'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.NO_URL_AND_TOKEN:
                ret.text = 'No URL and Token'
                ret.text_class = 'warning'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.NO_URL:
                ret.text = 'No URL'
                ret.text_class = 'warning'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.NO_TOKEN:
                ret.text = 'No Token'
                ret.text_class = 'warning'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.UNAUTHORIZED:
                ret.text = 'Unauthorized'
                ret.text_class = 'danger'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.NO_CONNECTION:
                ret.text = 'No Connection'
                ret.text_class = 'danger'
                ret.icon = 'alert-circle'
                break
            case HomeassistantStatus.CONNECTED:
                ret.text = 'Connected'
                ret.text_class = 'success'
                ret.icon = 'check'
                ret.spin = false
                break
        }

        return ret
    })

    async function init() {
        if (isBooting.value) {
            const ret = await window.api?.homeassistantGetStatus()
            if (ret) {
                homeassistantStatus.value = ret.homeassistantStatus
                homeassistantError.value = ret.error
            }
            if (homeassistantStatus.value !== HomeassistantStatus.CONNECTED) {
                console.warn(
                    'Homeassistant is not connected, cannot retrieve data, status:',
                    homeassistantStatus.value
                )
                return
            }
            await retrieveData()
        }
    }

    async function retrieveData(): Promise<void> {
        if (
            (services.value.length > 0 && entities.value.length > 0) ||
            servicesFront.value.length > 0 ||
            isRetrievingData.value ||
            homeassistantStatus.value !== HomeassistantStatus.CONNECTED
        ) {
            return
        }
        isRetrievingData.value = true

        try {
            const _servicesFront = await window.api?.homeassistantListServicesFront()
            if (!_servicesFront || _servicesFront.length === 0) {
                isRetrievingData.value = false
                return
            }
            servicesFront.value = _servicesFront as ActualService[]
            console.log('Homeassistant services front retrieved:', servicesFront.value.length)
        } catch (error) {
            console.error('Error retrieving Homeassistant services front:', error)
            isRetrievingData.value = false
            return
        }

        try {
            const _entities = await window.api?.homeassistantListEntities()
            if (!_entities || _entities.length === 0) {
                isRetrievingData.value = false
                return
            }
            entities.value = _entities as HaEntity[]
            console.log(
                'homeassistant IP entity: ',
                entities.value.find((e) => e.entity_id === 'sensor.oneplus_nord_4_wi_fi_ip_address')
            )
            isBooting.value = false
        } catch (error) {
            console.error('Error retrieving Homeassistant entities:', error)
            isRetrievingData.value = false
            return
        }
        return
    }

    async function checkSettings(settings: HomeassistantSettings): Promise<void> {
        await window.api?.homeassistantCheckSettings(settings)
    }

    window.api?.homeassistantStatusUpdate((status) => {
        console.log('Homeassistant status update:', status)
        if (status) {
            if (
                status.homeassistantStatus !== homeassistantStatus.value ||
                status.error !== homeassistantError.value
            ) {
                homeassistantStatus.value = status.homeassistantStatus
                homeassistantError.value = status.error
            }
        }
    })

    return {
        homeAssistantStatus: homeassistantStatus,
        homeassistantStatusProperties,
        homeassistantError,
        isBooting,
        content_height,
        services,
        entities,
        servicesFront,
        init,
        retrieveData,
        checkSettings
    }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useHomeassistantStore, import.meta.hot))
