<script setup lang="ts">
import appLayout from '@renderer/layouts/app.layout.vue'
import { useTaskerStore } from '../stores/tasker.store'
import { ref, onMounted, watch, computed } from 'vue'
import { ActiontypeFormComponent } from '../../../main/clients/tasker/ComponentTypes/ActiontypeFormComponent'
import BaseActionType from '../../../main/clients/tasker/actionTypes/BaseActionType'
import BaseButton from '../components/BaseButton.vue'
import EditSettings from './EditSettings.vue'
import { useRoute } from 'vue-router'

const taskerStore = useTaskerStore()

const currentAction = ref<BaseActionType | null>(null)
const actionTypeFormComponent = ref<ActiontypeFormComponent | null>(null)

const route = useRoute()
const index = computed(() => {
    const indexParam = route.params['index']
    return typeof indexParam === 'string' ? parseInt(indexParam, 10) : 0
})

watch(
    () => taskerStore.actionTypeRows,
    async (newValue) => {
        actionTypeFormComponent.value = null // Reset the form component when the action changes
        if (newValue.length > 0) {
            currentAction.value = newValue[index.value]
            if (!currentAction.value) {
                return
            }

            actionTypeFormComponent.value = await currentAction.value.getFormComponent()
        } else {
            currentAction.value = null
        }
    },
    { immediate: true }
)

onMounted(async () => {
    currentAction.value = taskerStore.actionTypeRows[index.value] || null
    if (!currentAction.value) {
        return
    }
    actionTypeFormComponent.value = await currentAction.value.getFormComponent()
})
const settingsActive = ref(false)

function save() {
    if (currentAction.value) {
        currentAction.value.submitForm()
        currentAction.value.submitSettingsForm()
        currentAction.value.setArgs()

        taskerStore.replaceAction(currentAction.value)
    }
}
</script>

<template>
    <appLayout title="Edit task">
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
