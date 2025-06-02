<script setup lang="ts">
import Sidebar from './_partials/sidebar.vue'
import MdiIcon from '../components/MdiIcon.vue'
import { useTaskerStore } from '../stores/tasker.store'

const taskerStore = useTaskerStore()

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
</script>
<template>
    <header class="navbar sticky-top bg-dark p-0 shadow" data-bs-theme="dark">
        <a class="navbar-brand me-0 px-3 fs-6 text-white" href="#"></a>
        <div class="navbar-right">
            <div class="d-flex align-items-center justify-content-end">
                <p class="ms-2 mb-1 mt-1 me-2" :class="taskerStore.taskerStatus.text_class">
                    {{ taskerStore.taskerStatus.text }}
                </p>
                <MdiIcon
                    :icon="taskerStore.taskerStatus.icon"
                    :spin="taskerStore.taskerStatus.spin"
                />
            </div>
        </div>
    </header>

    <div class="container-fluid">
        <div class="row">
            <Sidebar />
            <main class="col ms-sm-auto">
                <div
                    class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom"
                >
                    <h1 class="h2">{{ props.title }}</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <slot name="toolbar" />
                    </div>
                </div>
                <slot name="default" />
            </main>
        </div>
        <!-- <div class="draggingoverlay" :class="{ 'd-none': !isDraggingOver }">
            <MdiIcon icon="plus-circle-outline" />
        </div> -->
    </div>
</template>
