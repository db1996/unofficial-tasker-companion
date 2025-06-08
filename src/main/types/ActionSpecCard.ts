export default class ActionSpecCard {
    public type: 'action' | 'plugin' | 'filter' = 'action'
    public filter: string = ''
    public categoryCode: number = 0
    public code: number = 0
    public plugin: string | null = null
    public name: string = ''
    public bgColor: string = ''
    public icon: string = 'help'
}
