import type Action from '../types/Action'
import type { IActionTypeConstructor } from '../interfaces/IActionTypeConstructor'
import BaseActionType from '../actionTypes/BaseActionType'
import { forEach } from 'lodash'

export class ActionTypeManager {
    private types: IActionTypeConstructor[] = []
    private pluginTypes: IActionTypeConstructor[] = []
    public loaded = false

    async loadForms() {
        const formModules = [
            import('./../actionTypes/popup/PopupActionType'),
            import('./../actionTypes/HttpRequest/HttpRequestActionType'),
            import('./../actionTypes/BaseActionType')
        ]

        const pluginFormModules = [import('./../../homeassistant/actionTypes/HomeassistantAction')]

        const loadedForms = await Promise.all(formModules)
        this.types = loadedForms.map((m) => m.default as IActionTypeConstructor)

        const loadedPluginForms = await Promise.all(pluginFormModules)
        this.pluginTypes = loadedPluginForms.map((m) => m.default as IActionTypeConstructor)
        this.loaded = true
    }

    getActionType(action: Action): BaseActionType | null {
        const typeClass = this.types.find((TypeClass) => new TypeClass(action).canHandle())
        const type = typeClass ? new typeClass(action) : null

        if (type) {
            const pluginTypeClass = this.pluginTypes.filter((PluginTypeClass) =>
                new PluginTypeClass(action).canHandle()
            )
            forEach(pluginTypeClass, (PluginTypeClass) => {
                type.availablePluginActionTypes.push(new PluginTypeClass(action))
            })
        }
        return type
    }

    getPluginActionType(action: Action, plugin: string): BaseActionType | null {
        const typeClass = this.pluginTypes.find((TypeClass) => new TypeClass(action).pluginDetails?.id === plugin)
        return typeClass ? new typeClass(action) : null
    }
}
