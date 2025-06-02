<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch, computed, onMounted } from 'vue'
import BaseButton from '../BaseButton.vue'

const props = defineProps({
    modelValue: {
        type: [String, Number, Array<string>],
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
    },
    copy: {
        type: Boolean,
        default: false
    },
    passVisible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])
const proxyDisabled = ref(props.disabled)
const typeProxy = ref(props.type)
const proxyValue = computed(() => {
    if (Array.isArray(props.modelValue)) {
        return props.modelValue.join(', ')
    }
    return props.modelValue
})
function updateValue(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement

    if (Array.isArray(props.modelValue)) {
        const value = target.value.split(',').map((v) => v.trim())

        emit('update:modelValue', value)
        return
    }

    if (props.type === 'number') {
        const numValue = parseFloat(target.value)
        if (!isNaN(numValue)) {
            emit('update:modelValue', numValue)
            return
        }
    }
    emit('update:modelValue', target.value)
}
watch(
    () => props.disabled,
    (newValue) => {
        proxyDisabled.value = newValue
    }
)
onMounted(() => {
    if (props.passVisible) {
        togglePassword()
    }
})

const passwordIcon = ref('eye')
function togglePassword() {
    if (passwordIcon.value === 'eye') {
        passwordIcon.value = 'eye-off'
        typeProxy.value = 'text'
    } else {
        passwordIcon.value = 'eye'
        typeProxy.value = 'password'
    }
}
// make random described id
const randomId = Math.random().toString(36).substring(7)

const mainBadgeBg = ref('outline-secondary')
const flashCopied = ref(false)

watch(flashCopied, (value) => {
    if (value) {
        setTimeout(() => {
            flashCopied.value = false
            mainBadgeBg.value = 'outline-secondary'
        }, 500)
    }
})
async function copyToClipboard() {
    const str = props.modelValue.toString() || ''
    const res = await window.api?.copy(str)
    if (res) {
        mainBadgeBg.value = 'success'
    } else {
        mainBadgeBg.value = 'danger'
    }
    flashCopied.value = true
}
</script>
<template>
    <div :class="mainClass">
        <label v-if="label !== ''" :for="id" class="form-label">{{ label }}</label>
        <div v-if="useIg" :class="igClass">
            <BaseButton
                v-if="type === 'password'"
                sm
                btn-type="outline-secondary"
                icon-left-margin=""
                :icon-left="passwordIcon"
                @click="togglePassword"
            />
            <slot v-else name="igPrepend"></slot>
            <input
                v-if="type !== 'textarea'"
                :id="id"
                :type="typeProxy"
                class="form-control"
                :value="proxyValue"
                :aria-describedby="randomId"
                :placeholder="placeholder"
                :disabled="proxyDisabled"
                @input="updateValue"
            />
            <textarea
                v-else
                :id="id"
                class="form-control"
                :value="proxyValue"
                :aria-describedby="randomId"
                :placeholder="placeholder"
                :rows="textareaRows"
                :cols="textareaCols"
                :disabled="proxyDisabled"
                @input="updateValue"
            ></textarea>
            <BaseButton
                v-if="copy"
                sm
                :btn-type="mainBadgeBg"
                icon-left-margin=""
                icon-left="clipboard-text-outline"
                @click="copyToClipboard"
            />
            <slot name="igAppend"></slot>
        </div>
        <input
            v-else-if="type !== 'textarea'"
            :id="id"
            :type="type"
            class="form-control"
            :value="proxyValue"
            :aria-describedby="randomId"
            :placeholder="placeholder"
            :disabled="proxyDisabled"
            @input="updateValue"
        />
        <textarea
            v-else
            :id="id"
            class="form-control"
            :value="proxyValue"
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
