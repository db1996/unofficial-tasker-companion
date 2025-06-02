<script setup lang="ts">
import { computed, watch, type PropType } from 'vue'
import type HttpRequestActionType from '../HttpRequestActionType'
import { MethodType } from '../helpers/MethodType'
import { forEach } from 'lodash'
import TextInput from '../../../../../../renderer/src/components/form/TextInput.vue'
import SelectInput from '../../../../../../renderer/src/components/form/SelectInput.vue'
import NavTabs from '../../../../../../renderer/src/components/NavTab/NavTabs.vue'
import NavTabLink from '../../../../../../renderer/src/components/NavTab/NavTabLink.vue'
import NavTabContent from '../../../../../../renderer/src/components/NavTab/NavTabContent.vue'
import NavTabItem from '../../../../../../renderer/src/components/NavTab/NavTabItem.vue'
import BaseButton from '../../../../../../renderer/src/components/BaseButton.vue'
const props = defineProps({
    modelValue: Object as PropType<HttpRequestActionType>
})

const form = {
    method_type: props.modelValue?.params.method_type ?? MethodType.GET,
    url: props.modelValue?.params.url ?? '',
    headers: props.modelValue?.params.headers ?? [],
    query_parameters: props.modelValue?.params.query_parameters ?? [],
    body: props.modelValue?.params.body ?? ''
}

watch(
    () => props.modelValue,
    () => {
        recreateFormObject()
    },
    { immediate: true, deep: true }
)

function recreateFormObject() {
    if (!props.modelValue) return

    form.method_type = props.modelValue.currentFormObject['method_type'] ?? MethodType.GET
    form.url = props.modelValue.currentFormObject['url'] ?? ''
    form.headers = props.modelValue.currentFormObject['headers'] ?? []
    form.query_parameters = props.modelValue.currentFormObject['query_parameters'] ?? []
    form.body = props.modelValue.currentFormObject['body'] ?? ''
}

const methodTypeOptions = computed(() => {
    const ret: Array<{ value: number; label: string }> = []
    forEach(MethodType, (value, key) => {
        if (!isNaN(parseInt(key))) ret.push({ value: parseInt(key), label: value.toString() })
    })

    return ret
})

function removeHeader(index: number) {
    form.headers.splice(index, 1)
    props.modelValue?.updateFormObject('headers', form.headers)
}
function removeQueryParameter(index: number) {
    form.query_parameters.splice(index, 1)
    props.modelValue?.updateFormObject('query_parameters', form.query_parameters)
}

function addHeader() {
    form.headers.push({ key: '', value: '' })
    props.modelValue?.updateFormObject('headers', form.headers)
}

function addQueryParameter() {
    form.query_parameters.push({ key: '', value: '' })
    props.modelValue?.updateFormObject('query_parameters', form.query_parameters)
}
</script>
<template>
    <div class="row">
        <div class="col-2">
            <SelectInput
                id="method_type"
                v-model="form.method_type"
                :options="methodTypeOptions"
                label="Method"
                @update:model-value="
                    props.modelValue?.updateFormObject('method_type', form.method_type)
                "
            />
        </div>
        <div class="col-10">
            <TextInput
                id="name"
                v-model="form.url"
                label="Name"
                @update:model-value="props.modelValue?.updateFormObject('url', form.url)"
            />
        </div>
    </div>
    <hr />
    <NavTabs tab-name="main-tabs" default-tab="headers">
        <NavTabLink title="Headers" tab="headers" />
        <NavTabLink title="Query Parameters" tab="query_parameters" />
        <NavTabLink title="Body" tab="body" />
    </NavTabs>

    <NavTabContent tab-name="main-tabs">
        <NavTabItem tab="headers">
            <div v-for="(header, index) in form.headers" :key="index" class="row">
                <div class="col-5">
                    <TextInput
                        id="header_key_{{ index }}"
                        v-model="header.key"
                        label="Key"
                        @update:model-value="
                            props.modelValue?.updateFormObject(`headers.${index}.key`, header.key)
                        "
                    />
                </div>
                <div class="col-5">
                    <TextInput
                        id="header_value_{{ index }}"
                        v-model="header.value"
                        label="Value"
                        @update:model-value="
                            props.modelValue?.updateFormObject(
                                `headers.${index}.value`,
                                header.value
                            )
                        "
                    />
                </div>
                <div class="col-2 d-flex align-items-center">
                    <BaseButton
                        btn-class="btn-danger mt-3"
                        icon-left="trash-can"
                        @click="removeHeader(index)"
                    >
                        Remove
                    </BaseButton>
                </div>
            </div>
            <BaseButton btn-class="btn-primary" icon-left="plus" @click="addHeader">
                Add Header
            </BaseButton>
        </NavTabItem>
        <NavTabItem tab="query_parameters">
            <div v-for="(_param, index) in form.query_parameters" :key="index" class="row">
                <div class="col-5">
                    <TextInput
                        id="query_param_key_{{ index }}"
                        v-model="form.query_parameters[index].key"
                        label="Key"
                        @update:model-value="
                            props.modelValue?.updateFormObject(
                                `query_parameters.${index}.key`,
                                form.query_parameters[index].key
                            )
                        "
                    />
                </div>
                <div class="col-5">
                    <TextInput
                        id="query_param_value_{{ index }}"
                        v-model="form.query_parameters[index].value"
                        label="Value"
                        @update:model-value="
                            props.modelValue?.updateFormObject(
                                `query_parameters.${index}.value`,
                                form.query_parameters[index].value
                            )
                        "
                    />
                </div>
                <div class="col-2 d-flex align-items-center">
                    <BaseButton
                        btn-class="btn-danger mt-3"
                        icon-left="trash-can"
                        @click="removeQueryParameter(index)"
                    >
                        Remove
                    </BaseButton>
                </div>
            </div>
            <BaseButton btn-class="btn-primary" icon-left="plus" @click="addQueryParameter">
                Add Query Parameter
            </BaseButton>
        </NavTabItem>
        <NavTabItem tab="body">
            <TextInput
                id="body"
                v-model="form.body"
                label="Body"
                type="textarea"
                :textarea-rows="10"
                @update:model-value="props.modelValue?.updateFormObject('body', form.body)"
            />
        </NavTabItem>
    </NavTabContent>
</template>
