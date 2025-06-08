<script setup lang="ts">
import Sidebar from './_partials/sidebar.vue'
import { useTaskerStore } from '../stores/tasker.store'
import StatusBadge from '../components/StatusBadge.vue'
import BaseButton from '../components/BaseButton.vue'
import PickVariable from '../views/_partials/PickVariable.vue'
import { onUnmounted, ref } from 'vue'
import { useLastFocusInput } from '../stores/lastFocusInput.store'
import useTooltipStore from '../stores/useTooltip'

const tooltipStore = useTooltipStore()
const taskerStore = useTaskerStore()
const lastFocusInput = useLastFocusInput()
const showPickVariable = ref(false)

const props = defineProps({
    title: {
        type: String,
        required: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    size: {
        type: String,
        default: 'col-md-8'
    },
    dNone: {
        type: Boolean,
        default: false
    },
    mainId: {
        type: String,
        default: 'main'
    }
})
onUnmounted(() => {
    showPickVariable.value = false
    tooltipStore.destroyAllTooltips()
})

function pickedVariable(variable: string) {
    showPickVariable.value = false
    lastFocusInput.lastInput?.insertText(variable)
}
</script>
<template>
    <header class="navbar bg-dark p-0 shadow" data-bs-theme="dark">
        <a class="navbar-brand me-0 px-3 fs-6 text-white" href="/">
            <img src="../assets/resources/images/logo-wide.png" alt="Logo" style="width: 100%" />
        </a>
        <div class="navbar-right">
            <div class="d-flex align-items-center justify-content-end pt-2 pb-2">
                <StatusBadge
                    badge-tooltip="Tasker Status"
                    :bg="taskerStore.taskerStatus.text_class"
                    :status="taskerStore.taskerStatus.text"
                    :icon="taskerStore.taskerStatus.icon"
                    :spin="taskerStore.taskerStatus.spin"
                />
                <BaseButton
                    class="btn btn-secondary"
                    sm
                    icon-left="refresh"
                    @click="taskerStore.forceReloadTasker()"
                />
                <BaseButton
                    v-tooltip
                    data-title="Pick a variable"
                    class="btn btn-primary ms-4"
                    sm
                    icon-left="tag-plus"
                    @click="showPickVariable = true"
                />
            </div>
        </div>
    </header>
    <div class="container-fluid ps-0">
        <div class="d-flex" style="min-height: calc(100vh - 58px)">
            <Sidebar />
            <main style="flex: 2">
                <div class="ps-2 pt-2">
                    <div
                        class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom"
                    >
                        <h1 class="h2">{{ props.title }}</h1>
                        <div class="btn-toolbar mb-2 mb-md-0 pt-2">
                            <slot name="toolbar" />
                        </div>
                    </div>
                    <slot name="default" />
                </div>
            </main>
        </div>
    </div>

    <PickVariable
        v-if="showPickVariable"
        @picked="pickedVariable"
        @close="showPickVariable = false"
    />
</template>
