<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue'
import type BaseActionType from '../../../main/clients/tasker/actionTypes/BaseActionType'
import TextInput from '../components/form/TextInput.vue'
import { SettingsFormComponent } from '../../../main/clients/tasker/ComponentTypes/SettingsFormComponent'

const props = defineProps({
    modelValue: {
        type: Object as PropType<BaseActionType>,
        required: true
    }
})

const editSettingsForm = ref<SettingsFormComponent | null>(null)

const form = {
    label: ''
}

// Only initialize from modelValue if the form is empty or the action changes
watch(
    () => props.modelValue,
    async (newValue) => {
        if (!newValue) return

        if (!editSettingsForm.value) {
            editSettingsForm.value =
                (await newValue.getSettingsFormComponent()) as SettingsFormComponent | null
            recreateFormObject()
        }
    },
    { immediate: true, deep: true }
)

onMounted(() => {
    if (!props.modelValue) return

    editSettingsForm.value =
        props.modelValue.getSettingsFormComponent() as unknown as SettingsFormComponent | null
    recreateFormObject()
})

function recreateFormObject() {
    if (!props.modelValue) return

    form.label = props.modelValue.currentSettingsFormObject['label'] || ''
    console.log('Recreating sform object for:', form)
}
</script>
<template>
    <TextInput
        id="label"
        v-model="form.label"
        label="Label"
        @update:model-value="modelValue.updateSettingsFormObject('label', $event)"
    />

    <component
        :is="editSettingsForm.component"
        v-if="editSettingsForm"
        v-bind="editSettingsForm.props"
    />
</template>
