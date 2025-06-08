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
const code = computed(() => {
    const indexParam = route.params['code']
    return typeof indexParam === 'string' ? parseInt(indexParam, 10) : 0
})

const pluginEditType = computed(() => {
    const pluginType = route.params['plugin']
    return typeof pluginType === 'string' ? pluginType : ''
})

async function getFormComponent() {
    currentAction.value = taskerStore.createNewActionType(code.value, pluginEditType.value)
    if (currentAction.value) {
        actionTypeFormComponent.value = await currentAction.value.getFormComponent()
    } else {
        actionTypeFormComponent.value = null
    }
}

watch(
    () => code.value,
    async () => {
        await getFormComponent()
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
        console.log(`Saving action`, currentAction.value)

        await taskerStore.createAction(currentAction.value)
        nextTick(() => {
            router.push('/home')
        })
    }
}
</script>

<template>
    <appLayout :title="`Add task action - ${currentAction ? currentAction.name : ''}`">
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
