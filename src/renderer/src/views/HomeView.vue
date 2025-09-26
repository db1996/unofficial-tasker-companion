<script setup lang="ts">
import appLayout from '@renderer/layouts/app.layout.vue'
import draggable from 'vuedraggable'
import { useTaskerStore } from '../stores/tasker.store'
import ActionRow from '../components/ActionRow.vue'
import { onMounted, ref } from 'vue'
import PickNewTask from './_partials/PickNewTask.vue'
import ActionSpecCard from '../../../main/types/ActionSpecCard'
import router from '../router/index.router'
import BaseButton from '../components/BaseButton.vue'
import MdiIcon from '../components/MdiIcon.vue'

const taskerStore = useTaskerStore()
const showNewTask = ref(false)

onMounted(() => {
    taskerStore.refreshActions()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reorderAction(event: any) {
    if (event.newIndex !== event.oldIndex) {
        await taskerStore.moveAction(event.oldIndex, event.newIndex)
    }
}

async function newTaskPicked(card: ActionSpecCard) {
    console.log(`New task picked`, card)
    router.push({
        name: 'add',
        params: {
            code: card.code,
            plugin: card.plugin ?? ''
        }
    })
}
</script>

<template>
    <appLayout title="Edit task">
        <template #toolbar>
            <BaseButton class="btn btn-primary" sm @click="showNewTask = true">
                <MdiIcon icon="plus" />
                Add New Task
            </BaseButton>
        </template>
        <template #default>
            <div style="min-height: 200px">
                <div class="list-group">
                    <draggable
                        v-model="taskerStore.actionTypeRows"
                        group="people"
                        item-key="id"
                        handle=".action-row-reorder"
                        @end="reorderAction"
                    >
                        <template #item="{ element }">
                            <ActionRow
                                v-bind="{ modelValue: element }"
                                :key="element.id"
                                @refresh="taskerStore.refreshActions"
                            />
                        </template>
                    </draggable>
                </div>
            </div>
            <PickNewTask :show="showNewTask" @picked="newTaskPicked" @stop="showNewTask = false" />
        </template>
    </appLayout>
</template>
