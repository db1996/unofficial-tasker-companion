<script setup>
import router from '@renderer/router/index.router'
import useNavTabStore from '@renderer/stores/navTabs.store'
import { computed, inject } from 'vue'
const navTabStore = useNavTabStore()

const props = defineProps({
    tab: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    }
})

const tabName = inject('tabName')
const preserveState = inject('preserveState')
const currentTab = computed(() => {
    if (!router.currentRoute.value.query[tabName] && props.tab === navTabStore.tab) {
        return true
    }

    if (navTabStore.preserveState) {
        return navTabStore.tabName === tabName && props.tab === navTabStore.tab
    }

    return router.currentRoute.value.query[tabName] === props.tab
})
function selectTab () {
    if (preserveState) {
        // history.replaceState({}, null, `?${tabName}=${props.tab}`)
        currentTab.value = props.tab // Update the currentTab ref in parent component
        return
    }
    router.push({
        query: { [tabName]: props.tab }
    })
}
</script>

<template>
    <li class="nav-item">
        <button class="nav-link text-nowrap" :class="{ active: currentTab }" @click="selectTab">
            {{ title }}
        </button>
    </li>
</template>
