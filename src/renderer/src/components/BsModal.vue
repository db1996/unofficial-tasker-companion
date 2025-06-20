<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { Modal } from 'bootstrap' // Import Bootstrap's Modal class
import BaseButton from './BaseButton.vue'

import useTooltipStore from '../stores/useTooltip'
const tooltipStore = useTooltipStore()

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    widthClass: {
        type: String,
        default: ''
    },
    closeable: {
        type: Boolean,
        default: true
    },
    scrollable: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close'])

const modalElement = ref(null)
let bootstrapModal: Modal | null = null

const close = () => {
    tooltipStore.destroyAllTooltips()
    if (props.closeable) {
        emit('close')
    }
}

const closeOnEscape = (e: { key: string }) => {
    if (e.key === 'Escape' && props.show) {
        close()
    }
}

onMounted(() => {
    // Initialize the Bootstrap modal
    document.addEventListener('keydown', closeOnEscape)
    if (modalElement.value) {
        bootstrapModal = new Modal(modalElement.value)
        ;(modalElement.value as HTMLElement).addEventListener('hidden.bs.modal', close)
    }
})

watch(
    () => props.show,
    (newVal) => {
        if (newVal && bootstrapModal) {
            bootstrapModal.show()
        } else if (bootstrapModal) {
            tooltipStore.destroyAllTooltips()
            bootstrapModal.hide()
        }
    }
)

onUnmounted(() => {
    tooltipStore.destroyAllTooltips()
    if (bootstrapModal) {
        bootstrapModal.hide()
    }

    document.removeEventListener('keydown', closeOnEscape)
    if (modalElement.value) {
        ;(modalElement.value as HTMLElement).removeEventListener('hidden.bs.modal', close)
    }
    bootstrapModal = null // Cleanup
})

const maxWidthClass = computed(() => {
    if (props.widthClass === 'sm') {
        return 'modal-sm'
    } else if (props.widthClass === 'lg') {
        return 'modal-lg'
    } else if (props.widthClass === 'xl') {
        return 'modal-xl'
    } else {
        return 'modal-80vw'
    }
})
</script>

<template>
    <teleport to="#app">
        <div ref="modalElement" class="modal fade" tabindex="-1">
            <div
                class="modal-dialog"
                :class="[maxWidthClass, scrollable ? 'modal-dialog-scrollable' : '']"
                style="overflow-y: hidden !important"
                role="document"
            >
                <div class="modal-content">
                    <div class="modal-header justify-content-between">
                        <slot name="title" />
                        <BaseButton
                            v-if="closeable"
                            btn-type="btn-primary"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            icon-left="keyboard-esc"
                            @click="emit('close')"
                        />
                    </div>
                    <div class="modal-body">
                        <slot name="content" />
                    </div>
                    <div class="modal-footer">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>
