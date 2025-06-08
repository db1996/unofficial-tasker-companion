<script setup lang="ts">
import BaseButton from '../../components/BaseButton.vue'
import BsModal from '../../components/BsModal.vue'
import MdiIcon from '../../components/MdiIcon.vue'
import { useTaskerStore } from '../../stores/tasker.store'
import { Variable } from '../../../../main/clients/tasker/types/Variable'
import { computed, onMounted, ref } from 'vue'
const emit = defineEmits(['close', 'picked'])
const taskerStore = useTaskerStore()
const variables = ref<Array<Variable>>([])
const searchStr = ref('')
const searchInp = ref<HTMLInputElement | null>(null)
const clicked = ref('')
const show = ref(false)

onMounted(async () => {
    show.value = true
    variables.value = (await taskerStore.listVariables()) ?? []
})

const variableCards = computed(() => {
    const cards: Array<{ title: string; variable: string; description: string; clicked: boolean }> =
        []
    variables.value.forEach((variable) => {
        let title = ''
        let variableName = ''
        let description = ''

        if (variable.f !== undefined) {
            title = variable.f + ': ('
        }
        if (variable.b !== undefined) {
            title += variable.b
        }
        if (variable.f !== undefined) {
            title += ')'
        }

        variableName = variable.a ?? ''

        if (variable.c !== undefined) {
            description = variable.c
        }
        const isClicked = clicked.value === variableName

        if (searchStr.value !== '') {
            if (
                title.toLowerCase().includes(searchStr.value.toLowerCase()) ||
                variableName.toLowerCase().includes(searchStr.value.toLowerCase()) ||
                description.toLowerCase().includes(searchStr.value.toLowerCase())
            ) {
                cards.push({
                    title: title,
                    variable: variableName,
                    description: description,
                    clicked: isClicked
                })
            }
        } else {
            cards.push({
                title: title,
                variable: variableName,
                description: description,
                clicked: isClicked
            })
        }
    })

    return cards
})

function reset() {
    searchStr.value = ''
    if (searchInp.value) {
        searchInp.value.value = ''
    }
}

function copyVariable(variable: string) {
    // copy to clipboard
    clicked.value = variable
    navigator.clipboard.writeText(variable)

    setTimeout(() => {
        clicked.value = ''
    }, 500)
}

function addToInput(variable: string) {
    emit('picked', variable)
}
</script>
<template>
    <BsModal :show="show" @close="emit('close')">
        <template #title>
            <h5>Click a variable to copy it to your clipboard</h5>
        </template>
        <template #content>
            <div class="d-flex">
                <div style="flex-grow: 1">
                    <div class="input-group mb-3">
                        <input
                            ref="searchInp"
                            type="text"
                            class="form-control"
                            name="search"
                            @input="searchStr = ($event.target as HTMLInputElement).value"
                        />
                        <span id="basic-addon1" class="input-group-text">
                            <MdiIcon icon="magnify" />
                        </span>
                    </div>
                </div>
                <div>
                    <BaseButton
                        v-tooltip
                        :btn-class="'btn-secondary ms-4 me-2'"
                        icon-left="close"
                        data-title="Empty search"
                        @click="reset"
                    />
                </div>
            </div>
            <ul class="list-group">
                <li v-for="(value, key) in variableCards" :key="key" class="list-group-item">
                    <div class="row">
                        <div class="col-10">
                            <div class="row">
                                <div class="col-12">
                                    <div class="fw-bold">{{ value.title }}</div>
                                    <div class="fw-bold">{{ value.variable }}</div>
                                </div>
                                <div class="col-12">
                                    {{ value.description }}
                                </div>
                            </div>
                        </div>
                        <div class="col-2 d-flex justify-content-end align-items-center">
                            <BaseButton
                                v-tooltip
                                sm
                                :btn-class="value.clicked ? 'btn-success' : 'btn-secondary'"
                                icon-left="content-copy"
                                data-title="Copy to clipboard"
                                @click.stop="copyVariable(value.variable)"
                            />
                            <BaseButton
                                v-tooltip
                                sm
                                :btn-class="'btn-secondary'"
                                icon-left="content-paste"
                                class="ms-2"
                                data-title="Paste to last active input"
                                @click.stop="addToInput(value.variable)"
                            />
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </BsModal>
</template>
