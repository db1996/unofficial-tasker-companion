<script setup>
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:checked'])
const props = defineProps({
    checked: {
        type: [Array, Boolean, String],
        default: false
    },
    value: {
        type: [Array, Boolean, String, Number],
        default: null
    },
    label: String,
    group: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    switchType: {
        type: Boolean,
        default: false
    },
    returnTrue: {
        type: String,
        required: false
    },
    returnFalse: {
        type: String,
        required: false
    },
    describe: {
        type: String,
        default: ''
    }
})

const proxyChecked = ref(false)
const proxyDisabled = ref(props.disabled)
const input = ref()
const click = () => {
    input.value.click()
}
onMounted(() => {
    checkValue(props.checked)
})
watch(
    () => props.checked,
    (newValue) => {
        checkValue(newValue)
    }
)

function checkValue(value) {
    if (props.returnTrue && value === props.returnTrue) {
        proxyChecked.value = true
        return
    }
    if (props.returnFalse && value === props.returnFalse) {
        proxyChecked.value = false
        return
    }
    proxyChecked.value = value
}

watch(
    () => props.disabled,
    (newValue) => {
        proxyDisabled.value = newValue
    }
)

watch(proxyChecked, (newValue) => {
    if (props.returnTrue && newValue) {
        // console.log('proxyChecked', proxyChecked.value)
        // console.log(newValue)
        // console.log(props)
        emit('update:checked', props.returnTrue)
        return
    }
    if (props.returnFalse && !newValue) {
        emit('update:checked', props.returnFalse)
        return
    }
    emit('update:checked', newValue)
})
</script>

<template>
    <div v-if="group">
        <div class="form-check" :class="{ 'form-switch': switchType }">
            <input
                ref="input"
                v-model="proxyChecked"
                class="form-check-input"
                type="checkbox"
                :value="value"
                :disabled="proxyDisabled"
            />
            <label class="form-check-label" @click="click">{{ label }}</label>
        </div>
        <p v-if="describe !== ''" class="form-text">{{ describe }}</p>
    </div>
    <div v-else class="form-check" :class="{ 'form-switch': switchType }">
        <input
            ref="input"
            v-model="proxyChecked"
            class="form-check-input"
            type="checkbox"
            :value="value"
            :disabled="disabled"
        />
        <label class="form-check-label" @click="click">{{ label }}</label>
        <p v-if="describe !== ''" class="form-text">{{ describe }}</p>
    </div>
</template>
