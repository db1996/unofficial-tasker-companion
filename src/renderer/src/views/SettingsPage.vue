<script setup lang="ts">
import BaseButton from '@renderer/components/BaseButton.vue'
import appLayout from '@renderer/layouts/app.layout.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import TextInput from '@renderer/components/form/TextInput.vue'
import * as yup from 'yup'
import { useSettingsStore } from '../stores/settings.store'
import { AllSettings } from '../../../main/settings/types/AllSettings'
import NavTabLink from '../components/NavTab/NavTabLink.vue'
import NavTabs from '../components/NavTab/NavTabs.vue'
import NavTabContent from '../components/NavTab/NavTabContent.vue'
import NavTabItem from '../components/NavTab/NavTabItem.vue'
import Checkbox from '../components/form/Checkbox.vue'
import { useHomeassistantStore } from '../stores/homeassistant.store'
import { HomeassistantSettings } from '../../../main/settings/types/HomeassistantSettings'
import { HomeassistantStatus } from '../../../main/clients/homeassistant/enums/HomeassistantStatus'
import StatusBadge from '../components/StatusBadge.vue'
import { useTaskerStore } from '../stores/tasker.store'
import MdiIcon from '../components/MdiIcon.vue'
import PickEntityModal from '../../../main/clients/homeassistant/actionTypes/_partials/PickEntityModal.vue'

const saveState = ref<'btn-primary' | 'btn-secondary'>('btn-secondary')
const settingsStore = useSettingsStore()
const homeAssistantStore = useHomeassistantStore()
const taskerStore = useTaskerStore()

const form = reactive<AllSettings>({
    general: {
        tasker_url: ''
    },
    homeassistant: {
        active: false,
        url: '',
        token: '',
        replace_url_var: '',
        replace_token_var: '',
        fetch_phone_ip: false,
        phone_ip_entity_id: ''
    }
})

const schema: yup.Schema<AllSettings> = yup.object({
    general: yup.object({
        tasker_url: yup.string().required('Tasker URL is required')
    }),
    homeassistant: yup.object({
        active: yup.boolean().default(false),
        url: yup.string().optional().default(''),
        token: yup.string().optional().default(''),
        replace_url_var: yup.string().optional().default(''),
        replace_token_var: yup.string().optional().default(''),
        fetch_phone_ip: yup.boolean().default(false),
        phone_ip_entity_id: yup.string().optional().default('')
    })
})
const errors = ref<Record<string, string>>({})

onMounted(async () => {
    await settingsStore.getSettings()
    recreateForm()
})

function recreateForm() {
    Object.assign(form, JSON.parse(JSON.stringify(settingsStore.settings)) as AllSettings)
}

watch(
    () => settingsStore.settings,
    () => {
        recreateForm()
    }
)
// when user goes to another page, ask if they want to save changes
watch(
    form,
    (newValue) => {
        if (JSON.stringify(settingsStore.settings) !== JSON.stringify(newValue)) {
            saveState.value = 'btn-primary'
        } else {
            saveState.value = 'btn-secondary'
        }
    },
    { deep: true }
)

async function saveSettings() {
    if (!form) {
        console.error('⚠️ Form is null or undefined before validation!')
        return
    }

    console.log('🔍 Validating form:', JSON.stringify(form, null, 2))

    try {
        await schema.validate(form, { abortEarly: false })
        await settingsStore.saveSettings(form)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('❌ Validation failed:', err)

        if (err.inner) {
            console.error('🔍 Validation errors:', err.inner)
            errors.value = err.inner.reduce((acc: Record<string, string>, error) => {
                acc[error.path] = error.message
                return acc
            }, {})
        }
    }
}

async function checkSettingsHa() {
    homeAssistantStore.homeAssistantStatus = HomeassistantStatus.BOOTING
    const settings: HomeassistantSettings = {
        active: form.homeassistant.active,
        url: form.homeassistant.url,
        token: form.homeassistant.token,
        replace_url_var: form.homeassistant.replace_url_var,
        replace_token_var: form.homeassistant.replace_token_var,
        fetch_phone_ip: form.homeassistant.fetch_phone_ip,
        phone_ip_entity_id: form.homeassistant.phone_ip_entity_id
    }
    await homeAssistantStore.checkSettings(settings)
}

async function checkSettingsTasker() {
    taskerStore.taskerConnected = false

    await taskerStore.checkSettings(JSON.parse(JSON.stringify(form.general)))
}

function entityPicked(entityId: string) {
    form.homeassistant.phone_ip_entity_id = entityId
    showEntityPicker.value = false
}

const showEntityPicker = ref(false)
</script>

<template>
    <appLayout title="Settings">
        <template #toolbar>
            <BaseButton :btn-class="saveState" icon-left="content-save" @click="saveSettings">
                Save
            </BaseButton>
        </template>
        <template #default>
            <div class="card">
                <div class="card-header">
                    <NavTabs tab-name="settings" default-tab="general">
                        <NavTabLink title="General" tab="general" />
                        <NavTabLink title="Home Assistant" tab="homeassistant" />
                    </NavTabs>
                </div>
                <div class="card-body">
                    <NavTabContent tab-name="settings">
                        <NavTabItem tab="general">
                            <div class="row">
                                <div class="col-7">
                                    <TextInput
                                        id="tasker-url"
                                        v-model="form.general.tasker_url"
                                        label="Tasker URL"
                                        describe="Used to connect to your tasker web URL"
                                    />
                                </div>
                                <div class="col-5 d-flex align-items-start justify-content-end">
                                    <div class="d-flex align-items-center">
                                        <StatusBadge
                                            :bg="
                                                taskerStore.taskerConnected
                                                    ? 'success'
                                                    : taskerStore.taskerStatus.text_class
                                            "
                                            :status="
                                                taskerStore.taskerConnected
                                                    ? 'Connected'
                                                    : taskerStore.taskerStatus.text
                                            "
                                        />
                                        <BaseButton
                                            sm
                                            btn-class="btn-secondary"
                                            icon-left="reload"
                                            @click="checkSettingsTasker"
                                        />
                                    </div>
                                </div>
                            </div>

                            <h4>How do I connect to tasker?</h4>
                            <p>
                                In order for this application to connect to your tasker, you need to
                                set some things up first
                            </p>
                            <h5>Make sure you have the new UI enabled in Tasker</h5>
                            <ul>
                                <li>Open Tasker</li>
                                <li>
                                    Tap on
                                    <MdiIcon
                                        v-tooltip
                                        icon="dots-vertical"
                                        data-title="3 vertical dots top right"
                                    />
                                    in the top right
                                </li>
                                <li>Go to preferences</li>
                                <li>
                                    In the UI tab, at the bottom of the general section, enable "Use
                                    Tasker 2025 UI (VERY EARLY)"
                                </li>
                            </ul>

                            <h5>Enable the Tasker API and copy the URL</h5>
                            <ul>
                                <li>Open Tasker</li>
                                <li>Open any task</li>
                                <li>
                                    Tap on
                                    <MdiIcon
                                        v-tooltip
                                        icon="dots-vertical"
                                        data-title="3 vertical dots bottom left"
                                    />
                                    in the bottom left
                                </li>
                                <li>In the Network tab, enable "Enable WebUI"</li>
                                <li>
                                    Tap on
                                    <MdiIcon
                                        v-tooltip
                                        icon="link"
                                        data-title="Link icon next to 'Enable WebUI'"
                                    />
                                    next to "Enable WebUI" to copy the URL to your clipboard
                                </li>
                                <li>Enter the copied URL in the field above</li>
                            </ul>
                            <div class="alert alert-primary">
                                <strong><MdiIcon icon="information-outline" /> Info</strong>
                                <br />
                                The IP address of your device running Tasker may change <br />
                                If the IP is automatically (or manually) changed, Unofficial Tasker
                                Companion will not be able to detect it or connect anymore, enter
                                the new URL in the field again to fix this issue.
                                <br />
                                <br />
                                With the homeassistant plugin enabled, it is possible to
                                automatically fetch you phone's IP address
                            </div>
                        </NavTabItem>
                        <NavTabItem tab="homeassistant">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <Checkbox
                                        id="ha-active"
                                        v-model:checked="form.homeassistant.active"
                                        switch-type
                                        label="Enable Home Assistant"
                                    />
                                </div>
                                <div class="d-flex flex-end">
                                    <StatusBadge
                                        :bg="
                                            homeAssistantStore.homeassistantStatusProperties
                                                .text_class
                                        "
                                        :status="
                                            homeAssistantStore.homeassistantStatusProperties.text
                                        "
                                    />
                                    <BaseButton
                                        sm
                                        btn-class="btn-secondary"
                                        icon-left="reload"
                                        @click="checkSettingsHa"
                                    />
                                </div>
                            </div>
                            <br />
                            <TextInput
                                id="ha-url"
                                v-model="form.homeassistant.url"
                                label="Home Assistant URL"
                                describe="URL to your Home Assistant instance"
                            />
                            <TextInput
                                id="ha-token"
                                v-model="form.homeassistant.token"
                                label="Home Assistant Token"
                                describe="Long-lived access token for Home Assistant"
                            />
                            <TextInput
                                id="ha-replace-url-var"
                                v-model="form.homeassistant.replace_url_var"
                                label="Replace URL Variable"
                                describe="Text to replace the URL variable with in your HTTP request task, for if you want to use a tasker variable instead"
                            />
                            <TextInput
                                id="ha-replace-token-var"
                                v-model="form.homeassistant.replace_token_var"
                                label="Replace Token Variable"
                                describe="Text to replace the token with in your HTTP request task, for if you want to use a tasker variable instead"
                            />
                            <br />
                            <div>
                                <Checkbox
                                    id="ha-active"
                                    v-model:checked="form.homeassistant.fetch_phone_ip"
                                    switch-type
                                    label="Automatically fetch phone IP from Home Assistant if tasker can't connect"
                                />
                            </div>
                            <div class="row">
                                <div class="col-sm-10">
                                    <TextInput
                                        id="entity_id"
                                        v-model="form.homeassistant.phone_ip_entity_id"
                                        name="entity_id"
                                        label="Entity ID"
                                        describe="Entity ID of the phone IP address in Home Assistant, used to fetch the phone's IP address automatically. To enable this, you need to enable the 'WI-FI IP address' sensor in the home assistant companion app."
                                        required
                                    />
                                </div>
                                <div class="col-sm-2">
                                    <label class="form-control-label">Pick</label>
                                    <BaseButton
                                        :btn-class="'btn-primary'"
                                        class="w-100"
                                        @click="showEntityPicker = true"
                                    >
                                        <MdiIcon icon="pencil" />
                                    </BaseButton>
                                </div>
                            </div>
                            <div class="alert alert-primary">
                                <strong><MdiIcon icon="information-outline" /> Info</strong>
                                <br />
                                The Home Assistant plugin allows you to edit/create HTTP Request
                                actions with full support for all Home Assitant services. It allows
                                you to choose a service, enter the data and it will automatically
                                generate the HTTP Request action for you.
                                <br />
                                This effectively gives you access to every action you can do in a
                                Home Assistant script or automation.
                            </div>
                        </NavTabItem>
                    </NavTabContent>
                </div>
            </div>
            <PickEntityModal
                :show="showEntityPicker"
                @entity-picked="entityPicked"
                @stop="showEntityPicker = false"
            />
        </template>
    </appLayout>
</template>
