<script setup lang="ts">
import { ref, watch, type PropType, onBeforeUnmount, onMounted } from 'vue'
import HomeassistantAction from './HomeassistantAction'
import BaseButton from '../../../../renderer/src/components/BaseButton.vue'
import PickEntity from './_partials/PickEntity.vue'
import MdiIcon from '../../../../renderer/src/components/MdiIcon.vue'
import PickService from './_partials/PickService.vue'
import type { ActualService } from '../types/ActualService'
import type { HaServiceField } from '../types/HaServiceField'
import { useHomeassistantStore } from '../../../../renderer/src/stores/homeassistant.store'
import { HomeassistantStatus } from '../enums/HomeassistantStatus'
import TextInput from '../../../../renderer/src/components/form/TextInput.vue'
import Checkbox from '../../../../renderer/src/components/form/Checkbox.vue'

const homeassistantStore = useHomeassistantStore()
const props = defineProps({
    modelValue: Object as PropType<HomeassistantAction>,
    actionForm: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: Object as PropType<any>, // Or use the specific Vueform type if available
        required: false
    }
})


// Create a reference to the event handler function so it can be properly removed
const handleBackButton = (e: MouseEvent) => {
    console.log(`Mouse event detected: ${e.target}`, e.button);

    // If back button (usually button 3) is pressed and we're in a modal view
    if (e.button === 3 || (e.button === 0 && (e.target as HTMLElement)?.classList?.contains('back-button'))) {
        if (currentView.value === 'service' || currentView.value === 'entity') {
            e.preventDefault();
            currentView.value = 'main';
        }
    }
};

// Handle history navigation for modals
const handlePopState = (e: PopStateEvent) => {
    if (currentView.value !== 'main') {
        // If we're in a modal and back is pressed, just go back to main view
        currentView.value = 'main';

        // Prevent default navigation
        if (e.state?.modal) {
            history.pushState({ modal: false }, '');
        }
    }
};

onMounted(() => {
    window.addEventListener("mouseup", handleBackButton);
    window.addEventListener("popstate", handlePopState);

    // When switching to a modal view, add a history entry
    watch(currentView, (newView, oldView) => {
        if (newView !== 'main' && oldView === 'main') {
            // Add history entry when opening a modal
            history.pushState({ modal: true }, '');
        }
    });
});

onBeforeUnmount(() => {
    // Properly remove the same function reference
    window.removeEventListener("mouseup", handleBackButton);
    window.removeEventListener("popstate", handlePopState);

    // Ensure modals are closed and view is reset to prevent DOMException
    currentView.value = 'main';
});


const currentView = ref('main')
const pickService = ref(null)
const pickEntity = ref(null)
const currentService = ref<ActualService | null>(null)
const fieldsRef = ref<HaServiceField[]>([])
const currentServiceHasEntity = ref(false)

const form = {
    domain: '',
    service: '',
    entity_id: '',
    dataContainer: {} as Record<string, { toggle: boolean; value: string }>
}

const keys = ref<{ pickSerivce: number; pickEntity: number }>({
    pickSerivce: 1,
    pickEntity: 999999
})

watch(
    () => props.modelValue,
    () => {
        recreateFormObject()
    },
    { immediate: true, deep: true }
)

function recreateFormObject(forceservicePicked = false) {
    if (!props.modelValue) return

    const oldDomain = form.domain
    const oldService = form.service
    form.domain = props.modelValue.currentFormObject['domain'] || ''
    form.service = props.modelValue.currentFormObject['service'] || ''
    form.entity_id = props.modelValue.currentFormObject['entity_id'] || ''
    form.dataContainer = props.modelValue.currentFormObject['dataContainer'] || {}
    if (
        form.domain &&
        form.service &&
        (oldDomain !== form.domain || oldService !== form.service || forceservicePicked)
    ) {
        if (homeassistantStore.isBooting) {
            console.log('Home Assistant is booting, waiting for services to load')
            return
        }
        console.log('Service picked:', form.domain, form.service)
        servicePicked({
            domain: form.domain,
            service: form.service
        })
    }
}

onBeforeUnmount(() => {
    // Ensure modals are closed and view is reset to prevent DOMException
    currentView.value = 'main'
})

watch(
    () => homeassistantStore.servicesFront,
    () => {
        if (homeassistantStore.servicesFront.length > 0 && homeassistantStore.entities.length > 0) {
            console.log('Home Assistant entities and services loaded, recreating form object')
            recreateFormObject(true)
        }
    }
)

watch(
    () => homeassistantStore.entities,
    () => {
        if (homeassistantStore.servicesFront.length > 0 && homeassistantStore.entities.length > 0) {
            console.log('Home Assistant entities and services loaded, recreating form object')
            recreateFormObject(true)
        }
    }
)

async function servicePicked(pickedData: { domain: string; service: string }) {
    if (
        homeassistantStore.homeAssistantStatus !== HomeassistantStatus.CONNECTED ||
        homeassistantStore.servicesFront.length === 0
    ) {
        console.log('Home Assistant is not connected or services are not loaded')
        return
    }

    const service = homeassistantStore.servicesFront.find(
        (s) => s.id === pickedData.service || s.name === pickedData.service
    )
    if (!service) {
        console.log('Service not found:', pickedData.service, homeassistantStore.servicesFront)

        currentService.value = null
        fieldsRef.value = []
        return
    }

    keys.value.pickSerivce++
    if (pickedData.domain !== form.domain) {
        props.modelValue?.updateFormObject('entity_id', '')
        keys.value.pickEntity++
    }

    props.modelValue?.updateFormObject('domain', pickedData.domain)
    props.modelValue?.updateFormObject('service', pickedData.service)

    currentService.value = service
    currentServiceHasEntity.value = service.targetEntity || false
    fieldsRef.value = service.fields
    let dataContainer = {}

    if (service.fields && Object.keys(service.fields).length > 0) {
        // Initialize dataContainer with fields
        for (const field of Object.values(service.fields)) {
            dataContainer[field.id] = {
                toggle: false,
                value: ''
            }
        }
    } else {
        dataContainer = {}
    }
    props.modelValue?.updateFormObject('dataContainer', dataContainer)
    updateFullFormObject()
    currentView.value = 'main'
}

function getFieldrefById(id: string): HaServiceField | undefined {
    if (!fieldsRef.value) {
        console.warn('Fields reference is empty or not initialized', fieldsRef.value)
        return undefined
    }
    return fieldsRef.value.find((field) => field.id === id)
}

function updateFullFormObject() {
    props.modelValue?.updateFormObject('domain', form.domain)
    props.modelValue?.updateFormObject('service', form.service)
    props.modelValue?.updateFormObject('entity_id', form.entity_id)
    props.modelValue?.updateFormObject('dataContainer', form.dataContainer)
    console.log('Updated full form object:', props.modelValue?.currentFormObject)
}
</script>
<template>
    <div v-if="homeassistantStore.isBooting" class="alert alert-info">
        <p>Home Assistant is loading, please wait...</p>
    </div>
    <div v-if="!homeassistantStore.isBooting" v-show="currentView === 'main'">
        <div class="row">
            <div class="col">
                <h5>Fill in details</h5>
                <BaseButton :btn-class="'btn-secondary'" @click="currentView = 'service'">
                    Pick service
                </BaseButton>
            </div>
        </div>
        <TextInput
            id="domain"
            v-model="form.domain"
            name="Domain"
            label="Domain"
            required
            @update:model-value="updateFullFormObject()"
        />
        <TextInput
            id="service"
            v-model="form.service"
            name="Service"
            label="Service"
            required
            @update:model-value="updateFullFormObject()"
        />
        <div v-if="currentServiceHasEntity" class="row">
            <div class="col-sm-9">
                <TextInput
                    id="entity_id"
                    v-model="form.entity_id"
                    name="Entity ID"
                    label="Entity ID"
                    required
                    @update:model-value="updateFullFormObject()"
                />
            </div>
            <div class="col-sm-3">
                <label class="form-control-label">Pick</label>
                <BaseButton
                    :btn-class="'btn-primary'"
                    class="w-100"
                    @click="currentView = 'entity'"
                >
                    <MdiIcon icon="pencil" />
                </BaseButton>
            </div>
        </div>
        <div v-for="(fieldState, id) in form.dataContainer" :key="id" class="row">
            <div class="col-1 d-flex align-items-center pt-2">
                <Checkbox
                    id="extradata_{{ id }}_toggle"
                    name="extradata_{{ id }}_toggle"
                    :checked="fieldState.toggle"
                    switch-type
                    @update:checked="modelValue?.updateDataContainerToggle(id, $event)"
                />
            </div>
            <div class="col-11">
                <TextInput
                    id="extradata_{{ id }}_value"
                    v-model="fieldState.value"
                    :label="getFieldrefById(id)?.name"
                    @update:model-value="modelValue?.updateDataContainerValue(id, $event)"
                />
            </div>
        </div>
        <div v-for="(field, index) in fieldsRef" :key="index" class="row">
            <div v-if="!form.dataContainer[field.id]" class="col-1 d-flex align-items-center pt-2">
                <Checkbox
                    id="extradata_{{ field.id }}_toggle"
                    name="extradata_{{ field.id }}_toggle"
                    :checked="false"
                    switch-type
                    @update:checked="modelValue?.updateDataContainerToggle(field.id, $event)"
                />
            </div>
            <div v-if="!form.dataContainer[field.id]" class="col-11">
                <TextInput
                    id="extradata_{{ field.id }}_value"
                    :label="getFieldrefById(field.id)?.name"
                    @update:model-value="modelValue?.updateDataContainerValue(field.id, $event)"
                />
            </div>
        </div>
    </div>
    <div v-if="currentView === 'service' && !homeassistantStore.isBooting">
        <PickService
            ref="pickService"
            key="pickservice"
            :model-value="modelValue"
            @stop="currentView = 'main'"
        />
    </div>
    <div v-if="currentView === 'entity' && !homeassistantStore.isBooting">
        <PickEntity
            ref="pickEntity"
            key="pickentity"
            :model-value="modelValue"
            @stop="currentView = 'main'"
        />
    </div>
</template>
