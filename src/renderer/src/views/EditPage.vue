<script setup lang="ts">
import appLayout from '@renderer/layouts/app.layout.vue'
import { useTaskerStore } from '../stores/tasker.store'
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { ActiontypeFormComponent } from '../../../main/clients/tasker/ComponentTypes/ActiontypeFormComponent'
import BaseActionType from '../../../main/clients/tasker/actionTypes/BaseActionType'
import BaseButton from '../components/BaseButton.vue'
import EditSettings from './EditSettings.vue'
import { useRoute } from 'vue-router'
import router from '../router/index.router'

const taskerStore = useTaskerStore()

const currentAction = ref<BaseActionType | null>(null)
const actionTypeFormComponent = ref<ActiontypeFormComponent | null>(null)

const route = useRoute()
const index = computed(() => {
    const indexParam = route.params['index']
    return typeof indexParam === 'string' ? parseInt(indexParam, 10) : 0
})

const pluginEditType = computed(() => {
    const pluginType = route.params['plugin']
    return typeof pluginType === 'string' ? pluginType : ''
})

async function getFormComponent() {
    currentAction.value = taskerStore.actionTypeRows[index.value] || null
    if (!currentAction.value) {
        return
    }
    if (pluginEditType.value.length > 0) {
        if (currentAction.value.availablePluginActionTypes.length > 0) {
            currentAction.value =
                currentAction.value.availablePluginActionTypes.find(
                    (action) => action.pluginDetails?.id === pluginEditType.value
                ) || null
        } else {
            currentAction.value = null
        }
    }
    if (!currentAction.value) {
        return
    }
    actionTypeFormComponent.value = await currentAction.value.getFormComponent()
}

watch(
    () => taskerStore.actionTypeRows,
    async (newValue) => {
        actionTypeFormComponent.value = null // Reset the form component when the action changes
        if (newValue.length > 0) {
            await getFormComponent()
        } else {
            currentAction.value = null
        }
    },
    { immediate: true }
)

onMounted(async () => {
    await getFormComponent()
})

const settingsActive = ref(false)

async function save() {
    if (currentAction.value) {
        currentAction.value.submitForm()
        currentAction.value.submitSettingsForm()
        currentAction.value.setArgs()

        await taskerStore.replaceAction(currentAction.value)
        nextTick(() => {
            router.push('/home')
        })
    }
}
</script>

<template>
    <appLayout :title="`Edit task action - ${currentAction ? currentAction.name : ''}`">
        <template #toolbar>
            <BaseButton btn-class="btn-primary me-2" icon-left="content-save" @click="save">
                Save
            </BaseButton>
            <BaseButton
                btn-class="btn-secondary me-2"
                :icon-left="settingsActive ? 'close' : 'cog'"
                @click="settingsActive = !settingsActive"
            />
            <BaseButton
                v-tooltip
                btn-class="btn-secondary"
                icon-left="arrow-left"
                data-title="Back to actions list"
                to="/home"
            />
        </template>
        <template #default>
            <div style="min-height: 200px">
                <component
                    :is="actionTypeFormComponent.component"
                    v-if="actionTypeFormComponent && !settingsActive && currentAction"
                    v-bind="{ ...actionTypeFormComponent.props }"
                />
                <EditSettings v-if="currentAction && settingsActive" :model-value="currentAction" />
            </div>
        </template>
    </appLayout>
</template>
