<script setup lang="ts">
import { type PropType } from 'vue'
import BaseActionType from '../BaseActionType'
import { ActionTypeSpec } from '../../enums/ActionTypeSpec'
import TextInput from '../../../../../renderer/src/components/form/TextInput.vue'
import Checkbox from '../../../../../renderer/src/components/form/Checkbox.vue'

defineProps({
    modelValue: Object as PropType<BaseActionType>
})

function makeId(argId: number): string {
    return 'arg_' + argId
}
</script>
<template>
    <div>
        <template v-for="(arg, index) in modelValue?.action.actionSpec?.args" :key="index">
            <TextInput
                v-if="arg.type === ActionTypeSpec.STRING"
                :id="makeId(arg.id)"
                :value="modelValue?.currentFormObject[makeId(arg.id)]"
                :label="arg.name"
                @update:model-value="modelValue?.updateFormObject(makeId(arg.id), $event)"
            />
            <TextInput
                v-else-if="arg.type === ActionTypeSpec.INT"
                :id="makeId(arg.id)"
                :value="modelValue?.currentFormObject[makeId(arg.id)]"
                type="number"
                :label="arg.name"
                @update:model-value="modelValue?.updateFormObject(makeId(arg.id), $event)"
            />
            <Checkbox
                v-else-if="arg.type === ActionTypeSpec.BOOLEAN"
                :id="makeId(arg.id)"
                :value="modelValue?.currentFormObject[makeId(arg.id)]"
                :label="arg.name"
                switch-type
                @update:checked="modelValue?.updateFormObject(makeId(arg.id), $event)"
            />
            <TextInput
                v-else
                :id="makeId(arg.id)"
                :value="modelValue?.currentFormObject[makeId(arg.id)]"
                :label="arg.name"
                disabled
                :placeholder="'Argument is of type: ' + ActionTypeSpec[arg.type].toLowerCase()"
            />
        </template>
    </div>
</template>
