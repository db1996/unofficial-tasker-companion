<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, PropType, ref, watch } from 'vue'
import MdiIcon from '../../../../../renderer/src/components/MdiIcon.vue'
import DomainCard from '../../types/DomainCard'
import { capitalize, forEach } from 'lodash'
import BaseButton from '../../../../../renderer/src/components/BaseButton.vue'
import { useHomeassistantStore } from '../../../../../renderer/src/stores/homeassistant.store'
import TextInput from '../../../../../renderer/src/components/form/TextInput.vue'
import HomeassistantAction from '../HomeassistantAction'
import { HomeassistantStatus } from '../../enums/HomeassistantStatus'

const homeassistantStore = useHomeassistantStore()
const emit = defineEmits(['stop'])

const props = defineProps({
    modelValue: Object as PropType<HomeassistantAction>
})

const form = {
    search: '',
    domain: ''
}

function recreateFormObject() {
    if (!props.modelValue) return

    form.domain = props.modelValue.currentFormObject['domain'] || ''
}

const domainOrder = {
    light: {
        icon: 'lightbulb',
        friendlyName: 'Light'
    },
    script: {
        icon: 'script',
        friendlyName: 'Scripts'
    },
    automation: {
        icon: 'robot',
        friendlyName: 'Automations'
    },
    scene: {
        icon: 'palette',
        friendlyName: 'Scene'
    },
    helpers: {
        icon: 'tools',
        friendlyName: 'Helpers'
    },
    lock: {
        icon: 'lock',
        friendlyName: 'Lock'
    },
    media_player: {
        icon: 'cast',
        friendlyName: 'Media player'
    },
    notify: {
        icon: 'message',
        friendlyName: 'Notifications'
    },
    button: {
        icon: 'button-pointer',
        friendlyName: 'Button'
    },
    switch: {
        icon: 'toggle-switch-variant',
        friendlyName: 'Switch'
    },
    other: {
        icon: 'dots-horizontal',
        friendlyName: 'Other',
        other: true
    }
}
const domainCards = ref<DomainCard[]>([])

onMounted(async () => {
    console.log('Mounted pickService component, retrieving data...')
    if (homeassistantStore.isBooting) {
        return
    }
    recreateFormObject()
    searchServices()
})

watch(
    () => props.modelValue,
    () => {
        if (homeassistantStore.isBooting) {
            return
        }
        recreateFormObject()
        searchServices()
    },
    { immediate: true, deep: true }
)

watch(
    () => homeassistantStore.homeAssistantStatus,
    async () => {
        if (
            homeassistantStore.homeAssistantStatus === HomeassistantStatus.CONNECTED &&
            homeassistantStore.servicesFront.length > 0
        ) {
            initDefaultCards()
            recreateFormObject()
            searchServices()
        }
    },
    { immediate: true }
)

function initDefaultCards() {
    domainCards.value = []
    forEach(domainOrder, (value, key) => {
        const domainCard = new DomainCard()
        domainCard.domain = key
        domainCard.icon = value.icon
        domainCard.name = value.friendlyName

        domainCards.value.push(domainCard)
    })
}

function searchServices() {
    if (!form.search && !form.domain) {
        initDefaultCards()
        return
    }

    const search_str = form.search
    const domainSearch = form.domain
    const domainOrderKeys = Object.keys(domainOrder).filter((key) => key !== 'other')
    domainCards.value = []

    const servicesFiltered = homeassistantStore.servicesFront.filter(
        (service) =>
            service.domain.toLowerCase().includes(domainSearch.toLowerCase()) ||
            domainSearch === 'other' ||
            domainSearch.length === 0 ||
            (domainSearch === 'other' && !domainOrderKeys.includes(service.domain ?? ''))
    )

    if (servicesFiltered.length === 0) {
        initDefaultCards()
        return
    }

    forEach(servicesFiltered, (serviceFront) => {
        const domainCard = new DomainCard()
        domainCard.domain = serviceFront.domain ?? ''
        domainCard.name = capitalize(serviceFront.domain ?? '') + ': ' + (serviceFront.name ?? '')
        domainCard.description = serviceFront.description ?? ''
        domainCard.service = serviceFront.name ?? ''

        if (domainOrderKeys.includes(serviceFront.domain)) {
            forEach(domainOrder, (value, key) => {
                if (key === serviceFront.domain) {
                    domainCard.icon = value.icon
                }
            })
        }
        if (
            domainCard.name.toLowerCase().includes(search_str.toLowerCase()) ||
            domainCard.description.toLowerCase().includes(search_str.toLowerCase())
        ) {
            domainCards.value.push(domainCard)
        }
    })
}

function clickCard(domainCard: DomainCard) {
    domainCards.value = []
    if (domainCard.service) {
        props.modelValue?.updateFormObject('domain', domainCard.domain)
        props.modelValue?.updateFormObject('service', domainCard.service)
        props.modelValue?.updateFormObject('entity_id', '')
        props.modelValue?.updateFormObject('dataContainer', {})
        emit('stop')
    } else {
        props.modelValue?.updateFormObject('domain', domainCard.domain)
        props.modelValue?.updateFormObject('service', '')
        searchServices()
    }
}

function reset() {
    props.modelValue?.updateFormObject('domain', '')
    props.modelValue?.updateFormObject('service', '')
    searchServices()
}
</script>
<template>
    <div class="row">
        <div class="col-5">
            <div class="input-group mb-3">
                <input
                    v-model="form.search"
                    type="text"
                    class="form-control"
                    name="search"
                    placeholder="Search"
                    @input="searchServices"
                />
                <span id="basic-addon1" class="input-group-text">Search</span>
            </div>
        </div>
        <div class="col-5">
            <div class="input-group mb-3">
                <TextInput id="domain" v-model="form.domain" name="Domain" placeholder="Domain" />
            </div>
        </div>
        <div class="col-2">
            <BaseButton
                v-tooltip
                :btn-class="'btn-secondary'"
                icon-left="close"
                data-title="Empty search"
                @click="reset"
            />
            <BaseButton
                v-tooltip
                :btn-class="'btn-secondary ms-2'"
                icon-left="arrow-left"
                data-title="Go back to edit screen"
                @click="emit('stop')"
            />
        </div>
    </div>
    <ul class="list-group mt-2">
        <li
            v-for="(value, key) in domainCards"
            :key="key"
            class="list-group-item hover-active"
            @click="clickCard(value)"
        >
            <div class="row">
                <div class="col-1 d-flex align-items-center">
                    <MdiIcon :icon="value.icon" />
                </div>
                <div class="col">
                    <div class="row">
                        <div class="col">
                            <div class="fw-bold">{{ value.name }}</div>
                            {{ value.description }}
                        </div>
                        <div class="col-2 d-flex align-items-center justify-content-end">
                            <BaseButton sm btn-class="btn-secondary" icon-left="plus" />
                        </div>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</template>
