<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    bg: {
        type: String,
        default: 'primary'
    },
    status: {
        type: String,
        default: ''
    },
    badgeTooltip: {
        type: String,
        default: ''
    }
})

const classes = computed(() => {
    return `bg-${props.bg}`
})
</script>

<template>
    <div class="position-relative d-flex align-items-center me-3">
        <div class="me-2">{{ status }}</div>
        <span
            v-if="badgeTooltip !== ''"
            v-tooltip
            :data-title="badgeTooltip"
            class="border border-light rounded-circle"
            style="width: 10px; height: 10px; min-width: 10px; min-height: 10px"
            :class="classes"
            >&nbsp;
        </span>
        <span
            v-else
            class="border border-light rounded-circle"
            style="width: 10px; height: 10px; min-width: 10px; min-height: 10px"
            :class="classes"
            >&nbsp;
        </span>
    </div>
</template>
