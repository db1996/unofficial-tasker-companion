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

const saveState = ref('secondary')
const settingsStore = useSettingsStore()
const homeAssistantStore = useHomeassistantStore()

const form = reactive<AllSettings>({ ...settingsStore.settings })

const schema: yup.Schema<AllSettings> = yup.object({
    general: yup.object({
        tasker_url: yup.string().required('Tasker URL is required')
    }),
    homeassistant: yup.object({
        active: yup.boolean().default(false),
        url: yup.string().optional().default(''),
        token: yup.string().optional().default(''),
        replace_url_var: yup.string().optional().default(''),
        replace_token_var: yup.string().optional().default('')
    })
})
const errors = ref<Record<string, string>>({})

onMounted(async () => {
    watch(
        () => settingsStore.settings,
        (newValue) => {
            Object.assign(form, newValue)
        },
        {
            deep: true
        }
    )
})

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
</script>

<template>
    <appLayout title="Settings">
        <template #toolbar>
            <BaseButton :btn-type="saveState" icon-left="content-save" @click="saveSettings">
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
                                <div class="col-3">
                                    <h4>Tasker</h4>
                                </div>
                                <div class="col-9"></div>
                            </div>
                            <TextInput
                                id="tasker-url"
                                v-model="form.general.tasker_url"
                                label="Tasker URL"
                                describe="Used to connect to your tasker web URL"
                            />
                        </NavTabItem>
                        <NavTabItem tab="homeassistant">
                            <div class="row">
                                <div class="col-sm-11">
                                    <Checkbox
                                        id="ha-active"
                                        v-model:checked="form.homeassistant.active"
                                        switch-type
                                        label="Enable Home Assistant"
                                    />
                                </div>
                                <div class="col-sm-1">
                                    <BaseButton
                                        v-tooltip
                                        :btn-class="
                                            'btn-' +
                                            homeAssistantStore.homeassistantStatusProperties
                                                .text_class
                                        "
                                        :icon-left="
                                            homeAssistantStore.homeassistantStatusProperties.icon
                                        "
                                        :data-title="
                                            homeAssistantStore.homeassistantStatusProperties.text
                                        "
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
                        </NavTabItem>
                    </NavTabContent>
                </div>
            </div>
            <div></div>
        </template>
    </appLayout>
</template>
