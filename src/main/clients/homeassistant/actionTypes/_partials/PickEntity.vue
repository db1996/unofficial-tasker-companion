<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, PropType, ref, watch } from 'vue'
import type { HaEntity } from '../../types/HaEntity'
import MdiIcon from '../../../../../renderer/src/components/MdiIcon.vue'
import { forEach } from 'lodash'
import { useHomeassistantStore } from '../../../../../renderer/src/stores/homeassistant.store'
import HomeassistantAction from '../HomeassistantAction'
import BaseButton from '../../../../../renderer/src/components/BaseButton.vue'

const emits = defineEmits(['stop'])
const homeassistantStore = useHomeassistantStore()

const resultEntities = ref<HaEntity[] | null>(null)

const props = defineProps({
    modelValue: Object as PropType<HomeassistantAction>
})

const form = {
    search: '',
    domain: ''
}

watch(
    () => props.modelValue,
    () => {
        resultEntities.value = homeassistantStore.entities
        recreateFormObject()
        searchEntities()
    },
    { immediate: true, deep: true }
)

watch(
    () => homeassistantStore.entities,
    () => {
        if (homeassistantStore.entities.length > 0) {
            resultEntities.value = homeassistantStore.entities
            recreateFormObject()
            searchEntities()
        }
    },
    { immediate: true }
)

function recreateFormObject() {
    if (!props.modelValue) return

    form.domain = props.modelValue.currentFormObject['domain'] || ''
}

onMounted(async () => {
    if (homeassistantStore.isBooting || homeassistantStore.entities.length === 0) {
        return
    }
    resultEntities.value = homeassistantStore.entities
    recreateFormObject()
    searchEntities()
})

function getFriendlyName(entity: HaEntity) {
    return entity.attributes?.friendly_name ?? ''
}

function getIcon(entity: HaEntity) {
    const iconVal = entity.attributes?.icon ?? ''

    if (iconVal.startsWith('mdi:')) {
        return iconVal.replace('mdi:', '')
    }

    switch (entity.entity_id?.split('.')[0]) {
        case 'light':
            return 'lightbulb'
        case 'switch':
            return 'toggle-switch'
        case 'sensor':
            return 'thermometer'
        case 'binary_sensor':
            return 'motion-sensor'
        case 'media_player':
            return 'speaker'
        case 'climate':
            return 'thermostat'
        case 'cover':
            return 'window-shutter'
        case 'fan':
            return 'fan'
        case 'input_boolean':
            return 'toggle-switch'
        case 'input_number':
            return 'numeric-10'
        case 'input_select':
            return 'format-list-bulleted'
        case 'input_text':
            return 'textbox'
        case 'input_datetime':
            return 'calendar'
        case 'automation':
            return 'robot'
        case 'script':
            return 'script-text'
        case 'scene':
            return 'palette'
    }

    return ''
}

function searchEntities() {
    const ev = form.search

    resultEntities.value = []
    let domainEntityies = homeassistantStore.entities.filter((entity) =>
        entity.entity_id?.startsWith(form.domain + '.')
    )
    console.log(`Searching entities in domain: ${form.domain}`, domainEntityies)

    if (domainEntityies.length === 0) {
        domainEntityies = homeassistantStore.entities
    }
    forEach(domainEntityies, (entity) => {
        let friendlyName = ''
        let id = ''
        if (entity.attributes) {
            friendlyName = entity.attributes.friendly_name ?? ''
            id = entity.entity_id?.split('.')[1] ?? ''
        }
        if (
            friendlyName.toLowerCase().includes(ev.toLowerCase()) ||
            id.toLowerCase().includes(ev.toLowerCase())
        ) {
            resultEntities.value?.push(entity)
        }
    })
}

function pick(entity: HaEntity) {
    if (!props.modelValue) return

    console.log(`Picking entity: ${entity.entity_id}`, entity)

    props.modelValue.updateFormObject('entity_id', entity.entity_id ?? '')
    emits('stop')
}
</script>
<template>
    <div class="row">
        <div class="col-2">
            <p>Pick an entity</p>
        </div>
        <div class="col-9">
            <div class="input-group mb-3">
                <input
                    v-model="form.search"
                    type="text"
                    class="form-control"
                    name="search"
                    placeholder="Search"
                    @input="searchEntities"
                />
                <span id="basic-addon1" class="input-group-text"><MdiIcon icon="magnify" /></span>
            </div>
        </div>
        <div class="col-1">
            <BaseButton
                v-tooltip
                :btn-class="'btn-secondary'"
                icon-left="arrow-left"
                data-title="Go back to edit screen"
                @click="emits('stop')"
            />
        </div>
    </div>
    <ul class="list-group">
        <li
            v-for="(value, key) in resultEntities"
            :key="key + '_entity'"
            class="list-group-item hover-active"
            @click="() => pick(value)"
        >
            <div class="row">
                <div class="col-1">
                    <MdiIcon :icon="getIcon(value)" />
                </div>
                <div class="col-11">
                    <div class="fw-bold">{{ getFriendlyName(value) }}</div>
                    {{ value.entity_id?.toString() }}
                </div>
            </div>
        </li>
    </ul>
</template>
