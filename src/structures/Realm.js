module.exports = class Realm {
  #api
  constructor(api, data) {
    this.#api = api
    Object.assign(this, {
      id: data.id,
      remoteSubscriptionId: data.remoteSubscriptionId,
      owner: data.owner,
      ownerUUID: data.ownerUUID,
      name: data.name,
      motd: data.motd,
      defaultPermission: data.defaultPermission,
      state: data.state,
      daysLeft: data.daysLeft,
      expired: data.expired,
      expiredTrial: data.expiredTrial,
      gracePeriod: data.gracePeriod,
      worldType: data.worldType,
      players: data.players,
      maxPlayers: data.maxPlayers,
      minigameName: data.minigameName,
      minigameId: data.minigameId,
      minigameImage: data.minigameImage,
      activeSlot: data.activeSlot,
      slots: data.slots,
      member: data.member,
      clubId: data.clubId,
      subscriptionRefreshStatus: data.subscriptionRefreshStatus
    })
  }

  getCodes() {
    return this.#api.getRealmLinks(this.id)
  }

  createCode(expirationDate = null, enabled = true) {
    return this.#api.createRealmLink(this.id, expirationDate, enabled)
  }

  getAddress() {
    return this.#api.getRealmAddress(this.id)
  }

  invitePlayer(uuid) {
    return this.#api.invitePlayer(this.id, uuid)
  }

  open() {
    return this.#api.changeRealmState(this.id, "open")
  }

  close() {
    return this.#api.changeRealmState(this.id, "close")
  }

  delete() {
    return this.#api.deleteRealm(this.id)
  }

  getWorldDownload() {
    return this.#api.getRealmWorldDownload(this.id, this.activeSlot, "latest")
  }

  getBackups() {
    return this.#api.getRealmBackups(this.id, this.activeSlot)
  }

  saveBackup(name, slotId = this.activeSlot, backupsToReplace = null) {
    return this.#api.saveRealmBackup(this.id, slotId, name, backupsToReplace)
  }

  saveAutoBackup(backupId, name, slotId = this.activeSlot, backupsToReplace = null) {
    return this.#api.saveRealmAutoBackup(this.id, slotId, backupId, name, backupsToReplace)
  }

  restoreBackup(backupId, slotId = this.activeSlot) {
    return this.#api.restoreRealmBackup(this.id, slotId, backupId)
  }

  deleteBackup(backupId, slotId = this.activeSlot) {
    return this.#api.deleteRealmBackup(this.id, slotId, backupId)
  }

  getWorldSize(slotId = this.activeSlot) {
    return this.#api.getWorldSize(this.id, slotId)
  }

  getSubscriptionInfo(detailed = false) {
    return this.#api.getRealmSubscriptionInfo(this.id, detailed)
  }

  changeActiveSlot(slotId) {
    return this.#api.changeRealmActiveSlot(this.id, slotId)
  }

  changeNameAndDescription(name, description) {
    return this.#api.changeRealmNameAndDescription(this.id, name, description)
  }
}
