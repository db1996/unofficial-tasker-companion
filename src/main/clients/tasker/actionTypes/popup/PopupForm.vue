<script setup lang="ts">
import { onMounted, watch, type PropType } from 'vue'
import type PopupActionType from './PopupActionType'
import TextInput from '../../../../../renderer/src/components/form/TextInput.vue'

const props = defineProps({
    modelValue: Object as PropType<PopupActionType>
})

const form = {
    message: ''
}

onMounted(() => {
    if (props.modelValue) {
        recreateFormObject()
    }
})

watch(
    () => props.modelValue,
    () => {
        recreateFormObject()
    },
    { immediate: true, deep: true }
)

function recreateFormObject() {
    if (!props.modelValue) return

    form.message = props.modelValue.currentFormObject['message'] || ''
}
</script>
<template>
    <TextInput
        id="message"
        v-model="form.message"
        label="Message"
        @update:model-value="props.modelValue?.updateFormObject('message', $event)"
    />
</template>
