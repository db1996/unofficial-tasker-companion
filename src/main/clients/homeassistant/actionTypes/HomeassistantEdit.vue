<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import HomeassistantAction from './HomeassistantAction'
import BaseButton from '../../../../renderer/src/components/BaseButton.vue'
import MdiIcon from '../../../../renderer/src/components/MdiIcon.vue'
import PickService from './_partials/PickService.vue'
import type { ActualService } from '../types/ActualService'
import type { HaServiceField } from '../types/HaServiceField'
import { useHomeassistantStore } from '../../../../renderer/src/stores/homeassistant.store'
import { HomeassistantStatus } from '../enums/HomeassistantStatus'
import TextInput from '../../../../renderer/src/components/form/TextInput.vue'
import Checkbox from '../../../../renderer/src/components/form/Checkbox.vue'
import PickEntityModal from './_partials/PickEntityModal.vue'
import { HaServiceFieldType } from '../enums/HaServiceFieldType'
import SelectInput from '../../../../renderer/src/components/form/SelectInput.vue'

const homeassistantStore = useHomeassistantStore()
const props = defineProps({
    modelValue: Object as PropType<HomeassistantAction>,
    actionForm: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: Object as PropType<any>, // Or use the specific Vueform type if available
        required: false
    }
})

const currentService = ref<ActualService | null>(null)
const fieldsRef = ref<HaServiceField[]>([])
const currentServiceHasEntity = ref(false)

const form = {
    domain: '',
    service: '',
    entity_id: '',
    dataContainer: {} as Record<string, { toggle: boolean; value: string }>
}

watch(
    () => props.modelValue,
    () => {
        recreateFormObject()
    },
    { immediate: true, deep: true }
)

watch(
    () => props.actionForm,
    () => {
        if (props.actionForm) {
            recreateFormObject(true)
        }
    },
    { immediate: true, deep: true }
)

function recreateFormObject(forceservicePicked = false) {
    if (!props.modelValue) return

    const oldDomain = form.domain
    const oldService = form.service
    form.domain = props.modelValue.currentFormObject['domain'] || ''
    form.service = props.modelValue.currentFormObject['service'] || ''
    if (
        form.domain &&
        form.service &&
        (oldDomain !== form.domain || oldService !== form.service || forceservicePicked)
    ) {
        if (homeassistantStore.isBooting) {
            return
        }
        servicePicked(
            {
                domain: form.domain,
                service: form.service
            },
            false
        )
    }

    form.entity_id = props.modelValue.currentFormObject['entity_id'] || ''
    form.dataContainer = props.modelValue.currentFormObject['dataContainer'] || {}
}
watch(
    () => homeassistantStore.servicesFront,
    () => {
        if (homeassistantStore.servicesFront.length > 0 && homeassistantStore.entities.length > 0) {
            recreateFormObject(true)
        }
    }
)

watch(
    () => homeassistantStore.entities,
    () => {
        if (homeassistantStore.servicesFront.length > 0 && homeassistantStore.entities.length > 0) {
            recreateFormObject(true)
        }
    }
)

async function servicePicked(
    pickedData: { domain: string; service: string; entity_id?: string },
    updateForm: boolean = true
) {
    if (
        homeassistantStore.homeAssistantStatus !== HomeassistantStatus.CONNECTED ||
        homeassistantStore.servicesFront.length === 0
    ) {
        console.log('Home Assistant is not connected or services are not loaded')
        return
    }

    const service = homeassistantStore.servicesFront.find(
        (s) =>
            (s.id === pickedData.service || s.name === pickedData.service) &&
            s.domain === pickedData.domain
    )
    if (!service) {
        console.log('Service not found:', pickedData.service, homeassistantStore.servicesFront)

        currentService.value = null
        fieldsRef.value = []
        return
    }
    form.domain = pickedData.domain
    form.service = pickedData.service
    form.entity_id = ''
    if (pickedData.entity_id) {
        form.entity_id = pickedData.entity_id
    }
    form.dataContainer = {}

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
    form.dataContainer = dataContainer
    if (updateForm) {
        updateFullFormObject()
    }
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
}

function entityPicked(entityId: string) {
    props.modelValue?.updateFormObject('entity_id', entityId)
    showEntityPicker.value = false
}

const showEntityPicker = ref(false)
const showServicePicker = ref(false)
</script>
<template>
    <div v-if="homeassistantStore.isBooting" class="alert alert-info">
        <p>Home Assistant is loading, please wait...</p>
    </div>
    <div v-if="!homeassistantStore.isBooting">
        <div class="row">
            <div class="col">
                <h5>Fill in details</h5>
                <BaseButton :btn-class="'btn-secondary'" @click="showServicePicker = true">
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
                    @click="showEntityPicker = true"
                >
                    <MdiIcon icon="pencil" />
                </BaseButton>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-2">
                <label>Send data</label>
            </div>
            <div class="col-sm-10">
                <label class="form-control-label">Value</label>
            </div>
        </div>
        <div v-for="(fieldState, id) in form.dataContainer" :key="id" class="row">
            <div class="col-2 d-flex align-items-center pt-2">
                <Checkbox
                    id="extradata_{{ id }}_toggle"
                    name="extradata_{{ id }}_toggle"
                    :checked="fieldState.toggle"
                    switch-type
                    :label="getFieldrefById(id)?.name"
                    @update:checked="modelValue?.updateDataContainerToggle(id, $event)"
                />
            </div>
            <div class="col-10 pt-2">
                <TextInput
                    v-if="
                        getFieldrefById(id)?.type === HaServiceFieldType.TEXT ||
                        getFieldrefById(id)?.type === HaServiceFieldType.NUMBER ||
                        getFieldrefById(id)?.type === HaServiceFieldType.DATETIME ||
                        getFieldrefById(id)?.type === HaServiceFieldType.DATE ||
                        getFieldrefById(id)?.type === HaServiceFieldType.TIME
                    "
                    id="extradata_{{ field.id }}_value"
                    v-model="fieldState.value"
                    :type="getFieldrefById(id)?.type"
                    :describe="
                        getFieldrefById(id)?.type === HaServiceFieldType.NUMBER &&
                        getFieldrefById(id)?.min &&
                        getFieldrefById(id)?.max
                            ? `min: ${getFieldrefById(id)?.min} max: ${getFieldrefById(id)?.max}`
                            : ''
                    "
                    @update:model-value="modelValue?.updateDataContainerValue(id, $event)"
                />

                <SelectInput
                    v-else-if="getFieldrefById(id)?.type === HaServiceFieldType.SELECT"
                    id="extradata_{{ field.id }}_value"
                    :options="getFieldrefById(id)?.options || []"
                    @update:model-value="modelValue?.updateDataContainerValue(id, $event)"
                />

                <Checkbox
                    v-else-if="getFieldrefById(id)?.type === HaServiceFieldType.BOOLEAN"
                    id="extradata_{{ id }}_toggle"
                    name="extradata_{{ id }}_toggle"
                    switch-type
                    :checked="fieldState.value"
                    @update:checked="modelValue?.updateDataContainerValue(id, $event)"
                />
            </div>
        </div>
        <div v-for="(field, index) in fieldsRef" :key="index" class="row">
            <div v-if="!form.dataContainer[field.id]" class="col-2 d-flex align-items-center pt-2">
                <Checkbox
                    id="extradata_{{ field.id }}_toggle"
                    name="extradata_{{ field.id }}_toggle"
                    :checked="false"
                    switch-type
                    :label="field.name"
                    @update:checked="modelValue?.updateDataContainerToggle(field.id, $event)"
                />
            </div>
            <div v-if="!form.dataContainer[field.id]" class="col-10 pt-2">
                <TextInput
                    v-if="
                        field.type === HaServiceFieldType.TEXT ||
                        field.type === HaServiceFieldType.NUMBER ||
                        field.type === HaServiceFieldType.DATETIME ||
                        field.type === HaServiceFieldType.DATE ||
                        field.type === HaServiceFieldType.TIME
                    "
                    id="extradata_{{ field.id }}_value"
                    :type="field.type"
                    :label="getFieldrefById(field.id)?.name"
                    :describe="
                        field.type === HaServiceFieldType.NUMBER && field.min && field.max
                            ? `min: ${field.min} max: ${field.max}`
                            : ''
                    "
                    @update:model-value="modelValue?.updateDataContainerValue(field.id, $event)"
                />

                <SelectInput
                    v-else-if="field.type === HaServiceFieldType.SELECT"
                    id="extradata_{{ field.id }}_value"
                    :label="field.name"
                    :options="field.options || []"
                    @update:model-value="modelValue?.updateDataContainerValue(field.id, $event)"
                />

                <Checkbox
                    v-else-if="field.type === HaServiceFieldType.BOOLEAN"
                    id="extradata_{{ field.id }}_toggle"
                    name="extradata_{{ field.id }}_toggle"
                    :checked="false"
                    switch-type
                    @update:checked="modelValue?.updateDataContainerValue(field.id, $event)"
                />
            </div>
        </div>
    </div>
    <PickService
        v-if="showServicePicker"
        :domain="form.domain"
        @service-picked="servicePicked"
        @stop="showServicePicker = false"
    />
    <PickEntityModal
        v-if="showEntityPicker"
        :domain="form.domain"
        @entity-picked="entityPicked"
        @stop="showEntityPicker = false"
    />
</template>
