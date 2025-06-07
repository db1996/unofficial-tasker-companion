export type HomeassistantSettings = {
    active: boolean
    url: string
    token: string
    replace_url_var: string
    replace_token_var: string

    fetch_phone_ip: boolean
    phone_ip_entity_id: string
}
