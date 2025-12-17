module.exports = class Code {
    #api
    constructor(api, data) {
        this.#api = api
        Object.assign(this, {
            linkId: data.linkId,
            profileUuid: data.profileUuid,
            type: data.type,
            createdOn: data.ts,
            url: data.url,
            deepLinkUrl: data.deepLinkUrl,
            enabled: data.enabled,
            expirationDate: data.expirationDate
        })
    }

    async setEnabled(enabled) {
        return this.#api.setRealmLinkEnabled(this.worldId, this.linkId, enabled)
    }

    async setExpiry(expirationDate) {
        return this.#api.setRealmLinkExpiry(this.worldId, this.linkId, expirationDate)
    }

    async delete() {
        return this.#api.deleteRealmLink(this.linkId)
    }
}
