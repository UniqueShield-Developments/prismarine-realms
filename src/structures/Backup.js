module.exports = class Backup {
  #api
  #realm
  constructor(api, realm, data) {
    this.#api = api
    this.#realm = realm
    Object.assign(this, {
      id: data.backupId,
      name: data.backupName,
      date: data.date,
      uncompressedSize: data.uncompressedSize,
      compressedSize: data.compressedSize,
      gameMode: data.gameMode,
      gameDifficulty: data.gameDifficulty,
      gameServerVersion: data.gameServerVersion,
      worldType: data.worldType,
      isHardcore: data.isHardcore
    })
  }

  getDownload() {
    return this.#api.getRealmWorldDownload(this.#realm.realmId, this.#realm.slotId, this.id)
  }

  restore() {
    return this.#api.restoreRealmBackup(this.#realm.realmId, this.#realm.slotId, this.id)
  }

  delete() {
    return this.#api.deleteRealmBackup(this.#realm.realmId, this.#realm.slotId, this.id)
  }
}
