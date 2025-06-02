<script setup lang="ts">
import appLayout from '@renderer/layouts/app.layout.vue'
import draggable from 'vuedraggable'
import { useTaskerStore } from '../stores/tasker.store'
import ActionRow from '../components/ActionRow.vue'
import { onMounted } from 'vue'

const taskerStore = useTaskerStore()

onMounted(() => {
    taskerStore.refreshActions()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reorderAction(event: any) {
    if (event.newIndex !== event.oldIndex) {
        await taskerStore.moveAction(event.oldIndex, event.newIndex)
    }
}
</script>

<template>
    <appLayout title="Home">
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
    </appLayout>
</template>
