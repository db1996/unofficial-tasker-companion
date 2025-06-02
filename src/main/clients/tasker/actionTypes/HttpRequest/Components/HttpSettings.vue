<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue'
import type HttpRequestActionType from '../HttpRequestActionType'
import TextInput from '../../../../../../renderer/src/components/form/TextInput.vue'
import Checkbox from '../../../../../../renderer/src/components/form/Checkbox.vue'
const props = defineProps({
    modelValue: {
        type: Object as PropType<HttpRequestActionType>
    }
})
const booting = ref(true)

const form = {
    timeout: 30,
    trust_any_certificate: false,
    follow_redirects: true,
    use_cookies: false,
    structure_output: false
}

onMounted(() => {
    recreateFormObject()
    booting.value = false
})

function recreateFormObject() {
    if (!props.modelValue) return

    form.timeout = props.modelValue.currentCustomSettingsFormObject['timeout'] ?? 30
    form.trust_any_certificate =
        props.modelValue.currentCustomSettingsFormObject['trust_any_certificate'] ?? false
    form.follow_redirects =
        props.modelValue.currentCustomSettingsFormObject['follow_redirects'] ?? true
    form.use_cookies = props.modelValue.currentCustomSettingsFormObject['use_cookies'] ?? false
    form.structure_output =
        props.modelValue.currentCustomSettingsFormObject['structure_output'] ?? false
}

watch(
    () => props.modelValue?.currentCustomSettingsFormObject,
    () => {
        recreateFormObject()
    },
    { deep: true }
)
</script>
<template>
    <TextInput
        id="timeout"
        v-model="form.timeout"
        name="Timeout (s)"
        label="Timeout (s)"
        type="number"
        required
        @update:model-value="modelValue?.updateCustomSettingsFormObject('timeout', $event)"
    />
    <div v-if="!booting">
        <Checkbox
            id="trust_any_certificate"
            name="Trust any certificate"
            label="Trust any certificate"
            :checked="form.trust_any_certificate"
            switch-type
            @update:checked="
                form.trust_any_certificate = $event;
                modelValue?.updateCustomSettingsFormObject('trust_any_certificate', $event)
            "
        />
        <Checkbox
            id="follow_redirects"
            name="Follow Redirects"
            label="Follow Redirects"
            :checked="form.follow_redirects"
            switch-type
            @update:checked="
                form.follow_redirects = $event;
                modelValue?.updateCustomSettingsFormObject('follow_redirects', $event)
            "
        />
        <Checkbox
            id="use_cookies"
            name="Use Cookies"
            label="Use Cookies"
            :checked="form.use_cookies"
            switch-type
            @update:checked="
                form.use_cookies = $event;
                modelValue?.updateCustomSettingsFormObject('use_cookies', $event)
            "
        />
        <Checkbox
            id="structure_output"
            name="Structure Output (JSON)"
            label="Structure Output (JSON)"
            :checked="form.structure_output"
            switch-type
            @update:checked="
                form.structure_output = $event;
                modelValue?.updateCustomSettingsFormObject('structure_output', $event)
            "
        />
    </div>
</template>
