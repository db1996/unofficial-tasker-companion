<script setup>
import { onMounted, onUnmounted, provide, ref, watch } from 'vue'
import useNavTabStore from '@renderer/stores/navTabs.store'

const emit = defineEmits(['tabChanged'])

const props = defineProps({
    tabName: {
        type: String,
        default: 'tab'
    },
    preserveState: {
        type: Boolean,
        default: false
    },
    header: {
        type: Boolean,
        default: false
    },
    defaultTab: {
        type: String,
        default: ''
    }
})

const currentTab = ref(null)
const navTabStore = useNavTabStore()

provide('tabName', props.tabName)
provide('preserveState', props.preserveState)
provide('currentTab', currentTab)

watch(currentTab, () => {
    emit('tabChanged', currentTab.value)

    // Set values in the store
    navTabStore.tab = currentTab.value
    navTabStore.tabName = props.tabName
    navTabStore.preserveState = props.preserveState
})

watch(
    () => navTabStore.tab,
    (value) => {
        if (currentTab.value !== value) {
            currentTab.value = value
        }
    }
)

onMounted(() => {
    currentTab.value = props.defaultTab
    navTabStore.tab = props.defaultTab
    navTabStore.tabName = props.tabName
    navTabStore.preserveState = props.preserveState
})

onUnmounted(() => {
    navTabStore.tab = props.defaultTab
})
</script>

<template>
    <ul class="nav nav-tabs nav-overflow" :class="{ 'header-tabs': props.header }">
        <slot />
    </ul>
</template>
