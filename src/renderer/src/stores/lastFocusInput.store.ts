import { defineStore } from 'pinia'

type InputContext = {
    el: HTMLInputElement
    insertText: (text: string) => void
}

export const useLastFocusInput = defineStore('lastFocusInput', {
    state: () => ({
        lastInput: null as InputContext | null
    }),

    actions: {
        set(input: InputContext) {
            this.lastInput = input
        },
        insertText(text: string) {
            if (this.lastInput) {
                this.lastInput.insertText(text)
            }
        }
    }
})
