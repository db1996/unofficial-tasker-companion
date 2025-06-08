<script setup lang="ts">
import MdiIcon from './MdiIcon.vue'
import { computed, ref, type PropType } from 'vue'
import { forEach } from 'lodash'
import BaseActionType from '../../../main/clients/tasker/actionTypes/BaseActionType'
import BaseButton from './BaseButton.vue'
import { EditButton } from '../../../main/clients/tasker/types/EditButton'
import DropdownButton from './DropdownButton.vue'
import { ActionTypeSupportedType } from '../../../main/clients/tasker/enums/ActionTypeSupportedType'
import { useTaskerStore } from '../stores/tasker.store'

// const emit = defineEmits(['editAction', 'refresh'])
const taskerStore = useTaskerStore()

const props = defineProps({
    modelValue: {
        type: Object as PropType<BaseActionType>,
        required: true
    }
})

const toggled = ref(false)
const editLabel = ref(false)

function toggleExpand() {
    if (toggled.value) {
        toggled.value = false
    } else {
        toggled.value = true
    }
}

const argsList = computed(() => {
    const strstr: string[][] = []

    if (!props.modelValue.show_args) {
        return strstr
    }

    forEach(props.modelValue.action.args, (value) => {
        if (value.value !== undefined) {
            strstr.push([value.name, value.value.toString()])
        }
    })
    return strstr
})

const labelBg = computed(() => {
    if (props.modelValue.action.label !== undefined) {
        return 'bg-primary'
    }
    return 'bg-secondary'
})

const editTypes = computed(() => {
    const ret = {
        main: {
            type: 'custom',
            btnClass: 'btn-primary',
            tooltip: 'Custom action form',
            icon: 'pencil',
            plugin: null,
            to: `/edit/${props.modelValue.index}`
        } as EditButton,
        dropdown: Array<EditButton>()
    }

    if (props.modelValue.supportedType === ActionTypeSupportedType.DEFAULT) {
        ret.main = {
            type: 'default',
            btnClass: 'btn-secondary',
            tooltip: 'No custom form yet, edit the arguments directly',
            icon: 'pencil',
            plugin: null,
            to: `/edit/${props.modelValue.index}`
        } as EditButton
    }

    if (props.modelValue.availablePluginActionTypes.length > 0) {
        const firstPlugin = props.modelValue.availablePluginActionTypes[0]
        const mainNow = JSON.parse(JSON.stringify(ret.main)) as EditButton
        if (firstPlugin.pluginDetails?.id) {
            ret.main = {
                type: firstPlugin.type,
                btnClass: 'btn-success',
                tooltip: firstPlugin.pluginDetails?.tooltip,
                icon: firstPlugin.pluginDetails?.icon,
                plugin: firstPlugin.pluginDetails?.id,
                to: `/edit/${props.modelValue.index}/${firstPlugin.pluginDetails?.id}`
            } as EditButton
        }
        ret.dropdown = [mainNow]
        forEach(props.modelValue.availablePluginActionTypes, (pluginActionType, index) => {
            if (index === 0) {
                return // Skip the first one, it's already added as main
            }
            ret.dropdown.push({
                type: pluginActionType.type,
                btnClass: 'btn-secondary',
                tooltip: pluginActionType.pluginDetails?.tooltip,
                icon: pluginActionType.pluginDetails?.icon,
                plugin: pluginActionType.pluginDetails?.id,
                to: `/edit/${props.modelValue.index}/${pluginActionType.pluginDetails?.id}`
            } as EditButton)
        })
    }

    return ret
})

const isSavingLabel = ref(false)

async function saveLabel() {
    isSavingLabel.value = true
    const label = document.querySelector('.input-group input') as HTMLInputElement
    await taskerStore.saveLabel(props.modelValue.index, label.value)
    editLabel.value = false
    isSavingLabel.value = false
}

async function deleteAction() {
    await taskerStore.deleteAction(props.modelValue.index)
}
</script>
<template>
    <span class="list-group-item action-row mb-3">
        <div class="action-row-reorder">
            <MdiIcon :icon="'menu'" />
        </div>
        <div class="d-flex">
            <div class="action-row-dragcontent"></div>
            <div class="flex-grow-1 action-row-maincontent">
                <div class="d-flex justify-content-between">
                    <div class="d-flex align-items-center">
                        <h5 class="mb-1 me-2" style="text-wrap: nowrap">
                            {{ modelValue.name !== '' ? modelValue.name : modelValue.tasker_name }}
                        </h5>

                        <div
                            v-if="!editLabel"
                            class="cursor-pointer badge"
                            :class="labelBg"
                            @click="editLabel = true"
                        >
                            {{ modelValue.action.label ?? 'No label' }} <MdiIcon icon="pencil" />
                        </div>

                        <div class="input-group" style="height: 30px">
                            <input
                                v-if="editLabel"
                                type="text"
                                class="form-control"
                                :value="
                                    modelValue.action.label !== undefined
                                        ? modelValue.action.label
                                        : ''
                                "
                                @keyup.enter="saveLabel"
                            />
                            <BaseButton
                                v-if="editLabel"
                                btn-class="btn-outline-primary"
                                icon-left="content-save"
                                :loading="isSavingLabel"
                                @click="saveLabel"
                            />
                        </div>
                    </div>
                    <div>
                        <div v-if="editTypes.dropdown.length > 0" class="btn-group me-2">
                            <BaseButton
                                v-tooltip
                                sm
                                :data-title="editTypes.main.tooltip"
                                :btn-class="editTypes.main.btnClass"
                                :icon-left="editTypes.main.icon"
                                :to="editTypes.main.to ?? `/edit/${modelValue.index}`"
                                :checkrunning="true"
                            />
                            <button
                                type="button"
                                class="btn btn-success dropdown-toggle dropdown-toggle-split btn-sm"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <span class="visually-hidden">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu">
                                <DropdownButton
                                    v-for="editType in editTypes.dropdown"
                                    :key="editType.type"
                                    :icon="editType.icon"
                                    :txt="editType.tooltip"
                                    :to="editType.to ?? `/edit/${modelValue.index}`"
                                    @click="console.log('Clicked on', editType.to ?? `/edit/${modelValue.index}`)"
                                />
                            </ul>
                        </div>
                        <BaseButton
                            v-else
                            v-tooltip
                            sm
                            :data-title="editTypes.main.tooltip"
                            :btn-class="editTypes.main.btnClass"
                            :icon-left="editTypes.main.icon"
                            :checkrunning="true"
                            :to="editTypes.main.to ?? `/edit/${modelValue.index}`"
                            class="me-2"
                        />
                        <BaseButton
                            v-tooltip
                            sm
                            :checkrunning="true"
                            data-title="Delete action"
                            btn-class="btn-outline-danger"
                            icon-left="trash-can"
                            @click="deleteAction"
                        />
                    </div>
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <small v-html="modelValue.description"></small>
                <div class="table-responsive">
                    <table v-if="argsList.length > 0" class="table">
                        <thead>
                            <tr>
                                <th scope="col" style="min-width: 175px; max-width: 175px"></th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="3">Arguments</td>
                            </tr>
                            <tr
                                v-for="(value, key) in argsList"
                                v-show="key < 3 || toggled"
                                :key="value[0]"
                            >
                                <th scope="row">{{ value[0] }}</th>
                                <td>{{ value[1] }}</td>
                            </tr>
                            <tr v-if="argsList.length > 3">
                                <td colspan="3" class="row-hover fs-6" @click="toggleExpand">
                                    <div class="w-100">
                                        <span btn-class="btn-outline-primary">
                                            <MdiIcon
                                                :icon="
                                                    'arrow-collapse-' + (toggled ? 'up' : 'down')
                                                "
                                            />
                                            {{ toggled ? 'Show less' : 'Show more' }}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </span>
</template>
