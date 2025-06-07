<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import type { HaEntity } from '../../types/HaEntity'
import MdiIcon from '../../../../../renderer/src/components/MdiIcon.vue'
import { forEach } from 'lodash'
import { useHomeassistantStore } from '../../../../../renderer/src/stores/homeassistant.store'
import BsModal from '../../../../../renderer/src/components/BsModal.vue'

const emits = defineEmits(['stop', 'entity-picked'])
const homeassistantStore = useHomeassistantStore()
const props = defineProps({
    domain: {
        type: String,
        default: ''
    }
})
const resultEntities = ref<HaEntity[] | null>(null)

const form = {
    search: '',
    domain: ''
}

const show = ref(false)

watch(
    () => props.domain,
    (newVal) => {
        if (newVal) {
            resultEntities.value = homeassistantStore.entities
            form.domain = props.domain
            searchEntities()
        }
    },
    { immediate: true }
)

watch(
    () => homeassistantStore.entities,
    () => {
        if (homeassistantStore.entities.length > 0) {
            resultEntities.value = homeassistantStore.entities
            searchEntities()
        }
    },
    { immediate: true }
)

onMounted(async () => {
    if (homeassistantStore.isBooting || homeassistantStore.entities.length === 0) {
        return
    }
    resultEntities.value = homeassistantStore.entities
    searchEntities()
    show.value = true
    console.log(`Mounted PickEntityModal, found ${homeassistantStore.entities.length} entities`)
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
    emits('entity-picked', entity.entity_id)
    nextTick(() => {
        form.search = ''
        searchEntities()
    })
}
</script>
<template>
    <BsModal :show="show" @close="emits('stop')">
        <template #title>
            <h5 class="modal-title">Pick an entity</h5>
        </template>
        <template #content>
            <div class="row">
                <div class="col-2">
                    <p>Pick an entity</p>
                </div>
                <div class="col-10">
                    <div class="input-group mb-3">
                        <input
                            v-model="form.search"
                            type="text"
                            class="form-control"
                            name="search"
                            placeholder="Search"
                            @input="searchEntities"
                        />
                        <span id="basic-addon1" class="input-group-text"
                            ><MdiIcon icon="magnify"
                        /></span>
                    </div>
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
    </BsModal>
</template>
