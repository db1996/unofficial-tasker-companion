<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MdiIcon from './MdiIcon.vue'

const props = defineProps({
    password: String
})

const isHidden = ref(true)
const flashCopied = ref(false)

watch(flashCopied, (value) => {
    if (value) {
        setTimeout(() => {
            flashCopied.value = false
            mainBadgeBg.value = 'text-bg-secondary'
        }, 500)
    }
})

const shownValue = computed(() => {
    return isHidden.value ? '****************' : props.password
})

const mainBadgeBg = ref('text-bg-secondary')

async function copyToClipboard() {
    const str = props.password || ''
    const res = await window.api?.copy(str)
    if (res) {
        mainBadgeBg.value = 'text-bg-success'
    } else {
        mainBadgeBg.value = 'text-bg-danger'
    }
    flashCopied.value = true
    console.log(res)
}
</script>
<template>
    <span class="badge" :class="mainBadgeBg">
        <MdiIcon
            class="cursor-pointer"
            :icon="isHidden ? 'eye-off-outline' : 'eye-outline'"
            @click="isHidden = !isHidden"
        />
        <span class="ms-2 me-2">{{ shownValue }}</span>
        <MdiIcon icon="clipboard-text-outline" class="cursor-pointer" @click="copyToClipboard" />
    </span>
</template>
<style scss scoped>
span.badge {
    display: inline-block !important;
}
</style>
