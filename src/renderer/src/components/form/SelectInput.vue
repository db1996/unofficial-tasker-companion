<script lang="ts" setup>
import { forEach } from 'lodash'
import { defineProps, defineEmits, ref, watch, computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number, null],
        default: ''
    },
    options: {
        type: Array as () => Array<{ value: string | number; label: string }>,
        default: () => []
    },
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    },
    mainClass: {
        type: String,
        default: 'mb-3'
    },
    describe: {
        type: String,
        default: ''
    },
    useIg: {
        type: Boolean,
        default: false
    },
    igClass: {
        type: String,
        default: 'input-group'
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])
const proxyDisabled = ref(props.disabled)
const proxyValue = computed(() => {
    if (Array.isArray(props.modelValue)) {
        return props.modelValue.join(', ')
    }
    return props.modelValue
})
function updateValue(event: Event) {
    const target = event.target as HTMLSelectElement

    let selectedOption: string | number | null = null
    forEach(props.options, (option) => {
        if (option.value === target.value) {
            selectedOption = option.value
        }
        // check if int and convert to int if so
        if (typeof option.value === 'number' && parseInt(target.value, 10) === option.value) {
            selectedOption = parseInt(target.value, 10)
        }
    })

    emit('update:modelValue', selectedOption)
}
watch(
    () => props.disabled,
    (newValue) => {
        proxyDisabled.value = newValue
    }
)
// make random described id
const randomId = Math.random().toString(36).substring(7)
</script>
<template>
    <div :class="mainClass">
        <label v-if="label !== ''" :for="id" class="form-label">{{ label }}</label>
        <div v-if="useIg" :class="igClass">
            <slot name="igPrepend"></slot>
            <select
                :id="id"
                class="form-control"
                :aria-describedby="randomId"
                :value="proxyValue"
                :disabled="proxyDisabled"
                @change="updateValue"
            >
                <option v-for="option in options" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
            <slot name="igAppend"></slot>
        </div>
        <select
            v-else
            :id="id"
            class="form-select"
            :aria-describedby="randomId"
            :value="proxyValue"
            :disabled="proxyDisabled"
            @change="updateValue"
        >
            <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
            </option>
        </select>
        <div v-if="describe !== ''" :id="randomId" class="form-text">
            {{ describe }}
        </div>
    </div>
</template>
