<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch, onMounted } from 'vue'
import BaseButton from '../BaseButton.vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'text'
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
    textareaRows: {
        type: Number,
        default: 3
    },
    textareaCols: {
        type: Number,
        default: 20
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const proxyDisabled = ref(props.disabled)
const emit = defineEmits(['update:modelValue'])

function updateValue(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    emit('update:modelValue', target.value)
}
watch(
    () => props.disabled,
    (newValue) => {
        proxyDisabled.value = newValue
    }
)

const passwordIcon = ref('eye')
const passwordType = ref('password')
function togglePassword() {
    if (passwordIcon.value === 'eye') {
        passwordIcon.value = 'eye-off'
        passwordType.value = 'text'
    } else {
        passwordIcon.value = 'eye'
        passwordType.value = 'password'
    }
}

onMounted(() => {
    if (props.type === 'password') {
        passwordIcon.value = 'eye'
        passwordType.value = 'password'
    }
})
// make random described id
const randomId = Math.random().toString(36).substring(7)
</script>
<template>
    <div :class="mainClass">
        <label v-if="label !== ''" :for="id" class="form-label">{{ label }}</label>
        <div v-if="useIg" :class="igClass">
            <slot name="igPrepend"></slot>
            <input
                v-if="type !== 'textarea'"
                :id="id"
                :type="type"
                class="form-control"
                :value="modelValue"
                :aria-describedby="randomId"
                :placeholder="placeholder"
                :disabled="proxyDisabled"
                @input="updateValue"
            />
            <textarea
                v-else
                :id="id"
                class="form-control"
                :value="modelValue"
                :aria-describedby="randomId"
                :placeholder="placeholder"
                :rows="textareaRows"
                :cols="textareaCols"
                :disabled="proxyDisabled"
                @input="updateValue"
            ></textarea>

            <BaseButton
                v-if="type === 'password'"
                sm
                btn-type="outline-secondary"
                :icon-left="passwordIcon"
                @click="togglePassword"
            />
            <slot v-else name="igAppend"></slot>
        </div>
        <input
            v-else-if="type !== 'textarea'"
            :id="id"
            :type="type"
            class="form-control"
            :value="modelValue"
            :aria-describedby="randomId"
            :placeholder="placeholder"
            :disabled="proxyDisabled"
            @input="updateValue"
        />
        <textarea
            v-else
            :id="id"
            class="form-control"
            :value="modelValue"
            :aria-describedby="randomId"
            :placeholder="placeholder"
            :rows="textareaRows"
            :cols="textareaCols"
            :disabled="proxyDisabled"
            @input="updateValue"
        ></textarea>
        <div v-if="describe !== ''" :id="randomId" class="form-text">
            {{ describe }}
        </div>
    </div>
</template>
