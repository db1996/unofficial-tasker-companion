import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ActiontypeFormComponent } from '../../../main/clients/tasker/ComponentTypes/ActiontypeFormComponent'
import BaseActionType from '../../../main/clients/tasker/actionTypes/BaseActionType'
import { ActionTypeManager } from '../../../main/clients/tasker/helpers/ActionTypeManager'
import { TaskerClientActivityStatus } from '../../../main/clients/tasker/enums/TaskerClientActivityStatus'
import { TaskerErrorStatus } from '../../../main/clients/tasker/enums/taskerStoreError'
import Action from '../../../main/clients/tasker/types/Action'
import { cloneDeep, forEach } from 'lodash'
import ActionSpec from '../../../main/clients/tasker/types/specs/ActionSpec'
import { CategorySpec } from '../../../main/clients/tasker/types/CategorySpec'
import { GeneralSettings } from '../../../main/settings/types/GeneralSettings'
import { Variable } from '../../../main/clients/tasker/types/Variable'

export const useTaskerStore = defineStore('tasker', () => {
    const manager: ActionTypeManager = new ActionTypeManager()
    const activityStatus = ref<TaskerClientActivityStatus>(TaskerClientActivityStatus.NONE)
    const taskerErrorStatus = ref<TaskerErrorStatus>(TaskerErrorStatus.NONE)

    const taskerConnected = ref<boolean>(false)
    const content_height = '300px'
    const currentAction = ref<BaseActionType | null>(null)
    const actionSpecs = ref<ActionSpec[]>([])
    const categorySpecs = ref<CategorySpec[]>([])
    const actionTypeRows = ref<BaseActionType[]>([])
    const actionTypeFormComponent = ref<ActiontypeFormComponent | null>(null)
    const newBaseActionType = ref<BaseActionType | null>(null)

    const taskerStatus = computed(() => {
        const ret = {
            text: 'Up to date',
            text_class: 'success',
            icon: 'check',
            spin: false
        }

        if (taskerConnected.value) {
            if (activityStatus.value === TaskerClientActivityStatus.NONE) {
                ret.text = 'Up to date'
                ret.text_class = 'success'
                ret.icon = 'check'
            } else {
                switch (activityStatus.value) {
                    case TaskerClientActivityStatus.RETRIEVE:
                        ret.text = 'Retrieving tasker data'
                        ret.icon = 'progress-download'
                        ret.text_class = 'warning'
                        break
                    case TaskerClientActivityStatus.UPLOAD:
                        ret.text = 'Uploading tasker data'
                        ret.icon = 'progress-upload'
                        ret.text_class = 'warning'
                        break
                    default:
                        break
                }
            }
        } else {
            ret.text = taskerErrorStatus.value
            ret.text_class = 'danger'
            ret.icon = 'alert-circle'

            if (taskerErrorStatus.value === TaskerErrorStatus.NONE) {
                ret.text_class = 'secondary'
                ret.icon = 'loading'
                ret.spin = true
            }
        }

        return ret
    })

    watch(
        taskerConnected,
        (newvalue, oldvalue) => {
            if (newvalue && !oldvalue) {
                console.log('Tasker store connected')
                actionSpecs.value = []
                categorySpecs.value = []
                init()
            }
        },
        { immediate: true }
    )

    async function init() {
        console.log('Tasker store initializing...')
        if (!manager.loaded) {
            await manager.loadForms()
        }
        if (taskerConnected.value) {
            await getActionSpecs()
            await refreshActions()
        }
    }

    async function listVariables(): Promise<Variable[]> {
        try {
            const variables = await window.api?.taskerListVariables()
            return variables || []
        } catch (error) {
            console.error('Error listing tasker variables:', error)
            return []
        }
    }

    async function forceReloadTasker(): Promise<void> {
        const resp = await window.api?.taskerForceReload()

        if (resp) {
            actionSpecs.value = resp.actionSpecs || []
            categorySpecs.value = resp.categorySpecs || []
            console.log('Action specs reloaded:', actionSpecs.value.length)
            console.log('Category specs reloaded:', categorySpecs.value.length)
            await refreshActions()
        }
    }

    async function getActionSpecs(): Promise<void> {
        if (actionSpecs.value.length > 0) {
            return
        }

        try {
            const _actionSpecs = await window.api?.taskerListActionSpecs()
            if (_actionSpecs) {
                actionSpecs.value = _actionSpecs.actionSpecs || []
                categorySpecs.value = _actionSpecs.categorySpecs || []
                console.log('Action specs retrieved:', actionSpecs.value.length)
                console.log('Category specs retrieved:', categorySpecs.value.length)
            }
        } catch (error) {
            console.error('Error retrieving action specs:', error)
        }
    }

    const isRefreshing = ref(false)

    async function refreshActions() {
        if (isRefreshing.value) {
            return
        }
        isRefreshing.value = true
        try {
            console.log('Refreshing actions...')
            const actions: Array<Action> = (await window.api?.taskerListActions()) || []
            actionTypeRows.value = []
            forEach(actions, async (action, index) => {
                const baseActionType = manager.getActionType(action)
                if (baseActionType != null) {
                    baseActionType.index = index
                    actionTypeRows.value.push(baseActionType)
                }
            })

            console.log('Actions refreshed:', actionTypeRows.value)
        } catch (error) {
            console.error('Error refreshing actions:', error)
        } finally {
            isRefreshing.value = false
        }
    }

    async function saveLabel(index: number, label: string) {
        try {
            await window.api?.saveTaskLabel(index, label)
            await refreshActions()
            console.log('Action label saved:', index, label)
        } catch (error) {
            console.error('Error saving action label:', error)
        }
    }

    async function deleteAction(index: number) {
        try {
            console.log('Deleting action at index:', index)
            await window.api?.deleteTask(index)
            await refreshActions()
        } catch (error) {
            console.error('Error deleting action:', error)
        }
    }

    async function replaceAction(actionType: BaseActionType) {
        try {
            console.log('Replacing action at index:', actionType)
            // create a clone of the action without actionSpec
            const actionClone = cloneDeep(actionType.action)
            actionClone.actionSpec = null // remove actionSpec to avoid circular reference
            await window.api?.replaceAction(actionType.action.index, actionClone)
        } catch (error) {
            console.error('Error replacing action:', error)
        }
    }

    async function moveAction(fromIndex: number, toIndex: number) {
        try {
            console.log('Moving action from index:', fromIndex, 'to index:', toIndex)
            await window.api?.moveTask(fromIndex, toIndex)
            await refreshActions()
        } catch (error) {
            console.error('Error moving action:', error)
        }
    }

    async function checkSettings(settings: GeneralSettings) {
        try {
            await window.api?.taskerCheckSettings(settings)
        } catch (error) {
            console.error('Error retrieving tasker settings:', error)
        }
    }

    function createNewActionType(code: number, plugin: string): BaseActionType | null {
        let actionType: BaseActionType | null = null
        try {
            console.log('Creating new action with code:', code, 'and plugin:', plugin)
            forEach(actionSpecs.value, (actionSpec) => {
                if (actionSpec.code === code) {
                    const actualActionSpec = new ActionSpec(actionSpec)
                    const newAction = actualActionSpec.createAction()

                    if (newAction) {
                        if (plugin.length > 0) {
                            actionType = manager.getPluginActionType(
                                newAction,
                                plugin
                            ) as BaseActionType | null
                        } else {
                            actionType = manager.getActionType(newAction) as BaseActionType | null
                        }
                    }
                }
            })
        } catch (error) {
            console.error('Error creating new action:', error)
        }

        if (actionType) {
            console.log('New action created:', actionType)
            return actionType
        }

        return null
    }

    async function createAction(actionType: BaseActionType) {
        actionType.setArgs()
        const action = cloneDeep(actionType.action)
        console.log('actual save', action)

        await window.api?.createAction(action)
    }

    window.api?.taskerStatusUpdate((status) => {
        taskerConnected.value = status.connected
        if (
            status &&
            status.clientActivityStatus !== undefined &&
            status.errorStatus !== undefined
        ) {
            if (
                status.clientActivityStatus !== activityStatus.value ||
                status.errorStatus !== taskerErrorStatus.value
            ) {
                activityStatus.value = status.clientActivityStatus
                taskerErrorStatus.value = status.errorStatus
            }
        }
    })

    return {
        manager,
        activityStatus,
        taskerErrorStatus,
        taskerConnected,
        content_height,
        currentAction,
        actionTypeRows,
        actionTypeFormComponent,
        newBaseActionType,
        categorySpecs,
        actionSpecs,
        taskerStatus,
        init,
        refreshActions,
        saveLabel,
        deleteAction,
        moveAction,
        replaceAction,
        checkSettings,
        createNewActionType,
        createAction,
        forceReloadTasker,
        listVariables
    }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTaskerStore, import.meta.hot))
