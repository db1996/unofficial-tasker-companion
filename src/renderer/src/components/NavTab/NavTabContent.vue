<script setup>
import { provide } from 'vue'

const props = defineProps({
    tabName: {
        type: String,
        default: 'tab'
    }
})

provide('tabName', props.tabName)
</script>

<template>
    <div class="tab-content justify-content-start">
        <slot />
    </div>
</template>
