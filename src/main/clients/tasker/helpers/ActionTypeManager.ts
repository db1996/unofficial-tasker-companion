import type Action from '../types/Action'
import type { IActionTypeConstructor } from '../interfaces/IActionTypeConstructor'
import BaseActionType from '../actionTypes/BaseActionType'

export class ActionTypeManager {
    private types: IActionTypeConstructor[] = []
    public loaded = false

    async loadForms() {
        const formModules = [
            import('./../actionTypes/popup/PopupActionType'),
            import('./../../homeassistant/actionTypes/HomeassistantAction'),
            // import('./../actionTypes/HttpRequest/HttpRequestActionType'),
            import('./../actionTypes/BaseActionType')
        ]

        const loadedForms = await Promise.all(formModules)

        // Store constructors in `types`
        this.types = loadedForms.map((m) => m.default as IActionTypeConstructor)
        this.loaded = true
    }

    getFormForAction(action: Action): BaseActionType | null {
        const typeClass = this.types.find((TypeClass) => new TypeClass(action).canHandle())
        const type = typeClass ? new typeClass(action) : null
        return type
    }
}
