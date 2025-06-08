<script setup lang="ts">
import MdiIcon from '@renderer/components/MdiIcon.vue'
import { RouterLink } from 'vue-router';

defineProps({
    to: {
        type: String,
        default: '#'
    },
    icon: {
        type: String,
        required: false
    },
    txt: {
        type: String,
        required: false
    }
})
</script>
<template>
    <li>
        <RouterLink class="dropdown-item" :to="to">
            <MdiIcon v-if="icon" :icon="icon" class="me-2" />
            <slot v-if="$slots.default" />
            <template v-else>
                {{ txt }}
            </template>
        </RouterLink>
    </li>
</template>
