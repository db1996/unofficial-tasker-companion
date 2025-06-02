<script setup>
import { computed, inject } from 'vue'
import useNavTabStore from '@renderer/stores/navTabs.store'
import router from '@renderer/router/index.router'

const props = defineProps({
    tab: {
        type: String,
        required: true
    },
    persistent: {
        type: Boolean,
        default: true
    }
})

const tabName = inject('tabName')
const navTabStore = useNavTabStore()

const currentTab = computed(() => {
    // console.log(
    //     `query: ${router.currentRoute.value.query[tabName]}`,
    //     `propstab ${props.tab}`,
    //     `navtabstore_tab ${navTabStore.tab}`,
    //     `navtabstore_name ${navTabStore.tabName}`
    // )
    if (!router.currentRoute.value.query[tabName] && props.tab === navTabStore.tab) {
        return true
    }

    if (navTabStore.preserveState) {
        return navTabStore.tabName === tabName && props.tab === navTabStore.tab
    }

    return router.currentRoute.value.query[tabName] === props.tab
})
</script>

<template>
    <template v-if="props.persistent">
        <div v-show="currentTab" class="tab-pane fade animation show active">
            <slot />
        </div>
    </template>
    <template v-else>
        <div v-if="currentTab" class="tab-pane fade animation show active">
            <slot />
        </div>
    </template>
</template>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.animation {
    animation: 0.3s ease-in fade-in;
}
</style>
