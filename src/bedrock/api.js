const path = require("path")
const fs = require('fs');
const zlib = require('zlib');
const util = require('util');

const RealmAPI = require('../index')

const Realm = require('../structures/Realm')
const Download = require('../structures/Download');
const Code = require("../structures/Code");

module.exports = class BedrockRealmAPI extends RealmAPI {
  async getRealmAddress(realmId) {
    const data = await this.rest.get(`/worlds/${realmId}/join`)
    const [host, port] = data.address.split(':')
    return { host, port: Number(port) }
  }

  async getRealmFromInvite(realmInviteCode, invite = true) {
    if (!realmInviteCode) throw new Error('Need to provide a realm invite code/link')
    const clean = realmInviteCode.replace(/https:\/\/realms.gg\//g, '')
    const data = await this.rest.get(`/worlds/v1/link/${clean}`)
    if (!data.member && invite) await this.acceptRealmInviteFromCode(realmInviteCode) // If the player isn't a member, accept the invite
    return new Realm(this, data)
  }

  async getRealmInvite(realmId) {
    const data = await this.rest.get(`/links/v1?worldId=${realmId}`)
    return {
      inviteCode: data[0].linkId,
      ownerXUID: data[0].profileUuid,
      type: data[0].type,
      createdOn: data[0].ts,
      inviteLink: data[0].url,
      deepLinkUrl: data[0].deepLinkUrl
    }
  }

  async refreshRealmInvite(realmId) {
    const data = await this.rest.post('/links/v1', {
      body: {
        type: 'INFINITE',
        worldId: realmId
      }
    })
    return {
      inviteCode: data.linkId,
      ownerXUID: data.profileUuid,
      type: data.type,
      createdOn: data.ts,
      inviteLink: data.url,
      deepLinkUrl: data.deepLinkUrl
    }
  }

  async getPendingInviteCount() {
    return await this.rest.get('/invites/count/pending')
  }

  async getPendingInvites() {
    const data = await this.rest.get('/invites/pending')
    return data.invites.map(invite => {
      return {
        invitationId: invite.invitationId,
        worldName: invite.worldName,
        worldDescription: invite.worldDescription,
        worldOwnerName: invite.worldOwnerName,
        worldOwnerXUID: invite.worldOwnerUuid,
        createdOn: invite.date
      }
    })
  }

  async acceptRealmInvitation(invitationId) {
    await this.rest.put(`/invites/accept/${invitationId}`)
  }

  async rejectRealmInvitation(invitationId) {
    await this.rest.put(`/invites/reject/${invitationId}`)
  }

  async acceptRealmInviteFromCode(inviteCode) {
    if (!inviteCode) throw new Error('Need to provide a realm invite code/link')
    const clean = inviteCode.replace(/https:\/\/realms.gg\//g, '')
    const data = await this.rest.post(`/invites/v1/link/accept/${clean}`)
    return new Realm(this, data)
  }

  async invitePlayer(realmId, uuid) {
    const data = await this.rest.put(`/invites/${realmId}/invite/update`, {
      body: {
        invites: {
          [uuid]: 'ADD'
        }
      }
    })
    return new Realm(this, data)
  }

  async getRealmWorldDownload(realmId, slotId, backupId = 'latest') {
    const data = await this.rest.get(`/archive/download/world/${realmId}/${slotId}/${backupId}`) // if backupId = latest will get the world as it is now not the most recent backup
    return new Download(this, data)
  }

  async resetRealm(realmId) {
    await this.rest.put(`/worlds/${realmId}/reset`)
  }

  // Reference https://github.com/PrismarineJS/prismarine-realms/issues/34 for configuration structure
  // async changeRealmConfiguration (realmId, configuration) {
  //   await this.rest.put(`/worlds/${realmId}/configuration`, {
  //     body: configuration
  //   })
  // }

  async removePlayerFromRealm(realmId, xuid) {
    const data = await this.rest.put(`/invites/${realmId}/invite/update`, {
      body: {
        invites: {
          [xuid]: 'REMOVE'
        }
      }
    })
    return new Realm(this, data)
  }

  async opRealmPlayer(realmId, uuid) {
    const data = await this.rest.put(`/invites/${realmId}/invite/update`, {
      body: {
        invites: {
          [uuid]: 'OP'
        }
      }
    })
    return new Realm(this, data)
  }

  async deopRealmPlayer(realmId, uuid) {
    const data = await this.rest.put(`/invites/${realmId}/invite/update`, {
      body: {
        invites: {
          [uuid]: 'DEOP'
        }
      }
    })
    return new Realm(this, data)
  }

  async banPlayerFromRealm(realmId, uuid) {
    await this.rest.post(`/worlds/${realmId}/blocklist/${uuid}`)
  }

  async unbanPlayerFromRealm(realmId, uuid) {
    await this.rest.delete(`/worlds/${realmId}/blocklist/${uuid}`)
  }

  async removeRealmFromJoinedList(realmId) {
    await this.rest.delete(`/invites/${realmId}`)
  }

  async changeIsTexturePackRequired(realmId, forced) {
    if (forced) {
      await this.rest.put(`/world/${realmId}/content/texturePacksRequired`)
    } else {
      await this.rest.delete(`/world/${realmId}/content/texturePacksRequired`)
    }
  }

  async changeRealmDefaultPermission(realmId, permission) {
    await this.rest.put(`/world/${realmId}/defaultPermission`, {
      body: {
        permission: permission.toUpperCase()
      }
    })
  }

  async changeRealmPlayerPermission(realmId, permission, uuid) {
    await this.rest.put(`/world/${realmId}/userPermission`, {
      body: {
        permission: permission.toUpperCase(),
        xuid: uuid
      }
    })
  }
  async uploadBehaviourPack(realmId, behaviourPackPath, archiveSavePath = path.join(behaviourPackPath, "..", "packArchive")) {
    const mkdir = util.promisify(fs.mkdir);
    const pipeline = util.promisify(require('stream').pipeline);

    await mkdir(archiveSavePath, { recursive: true });

    const packName = path.basename(behaviourPackPath);
    const archivePath = path.join(archiveSavePath, `${packName}.gz`);

    const source = fs.createReadStream(behaviourPackPath);
    const destination = fs.createWriteStream(archivePath);
    const gzip = zlib.createGzip();

    await pipeline(source, gzip, destination);

    const buffer = await fs.promises.readFile(archivePath);
    const slotId = this.getRealm(realmId).activeSlot
    const { token } = await this.rest.get(`/archive/upload/packs/${realmId}/${slotId}`)
    await this.rest.post("/packs", {
      headers: {
        "authorization": `Bearer ${token}`
      },
      body: buffer
    })


  }

  async createRealmLink(worldId, expirationDate = null, enabled = true) {
    const body = {
      type: "INFINITE",
      enabled,
      worldId
    }

    if (expirationDate !== null) body.expirationDate = expirationDate

    const data = await this.rest.post("/links/v1", { body })
    return new Code(this, data)
  }

  async getRealmLinks(worldId) {
    const data = await this.rest.get(`/links/v1?worldId=${worldId}`)
    return data.map(code => new Code(this, { ...code, worldId }))
  }

  async updateRealmLink(worldId, linkId, enabled = true, expirationDate = null) {
    const body = {
      enabled,
      linkId,
      worldId
    }

    if (expirationDate !== null) body.expirationDate = expirationDate

    return await this.rest.post("/links/v1/update", { body })
  }

  async setRealmLinkEnabled(worldId, linkId, enabled) {
    return await this.updateRealmLink(worldId, linkId, enabled, null)
  }

  async setRealmLinkExpiry(worldId, linkId, expirationDate) {
    return await this.updateRealmLink(worldId, linkId, true, expirationDate)
  }

  async deleteRealmLink(linkId) {
    return await this.rest.delete(`/links/v1/delete/${linkId}`)
  }



  async isPackAccessible(manifest) {
    const [authHeader, authToken] = this.rest.getAuth()

    const versionStr = Array.isArray(manifest.header.version)
      ? manifest.header.version.join('.')
      : manifest.header.version

    const res = await fetch(`https://pocket.realms.minecraft.net/pack/${manifest.header.uuid}/${versionStr}`, {
      method: 'HEAD',
      headers: {
        [authHeader]: authToken,
        'User-Agent': 'MCPE/UWP',
        'Accept': '*/*'
      }
    })

    return res.status === 204
  }


  async uploadPack(archivePath, realmId) {
    const { token, uploadUrl } = await this.rest.get(`/archive/upload/packs/${realmId}/1`)

    await fetch(uploadUrl, {
      method: 'POST',
      body: fs.createReadStream(archivePath),
      duplex: "half",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Content-Type': 'application/zip'
      }
    })
  }

  async getWorldContent(realmId) {
    return await this.rest.get(`/world/${realmId}/content`)
  }

  async updateWorldContent(realmId, behaviorPacks, resourcePacks) {
    return await this.rest.post(`/world/${realmId}/content/`, {
      body: { behaviorPacks, resourcePacks }
    })
  }

  async uploadBehaviourPack(realmId, behaviourPackPath, archiveSavePath = path.join(behaviourPackPath, "..", "packArchive"), packPosition = 0) {
    const manifestPath = path.join(behaviourPackPath, "manifest.json")
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

    const packName = path.basename(behaviourPackPath)
    const archivePath = path.join(archiveSavePath, `${packName}.zip`)

    await util.createZip(behaviourPackPath, archivePath)
    await this.isPackAccessible(manifest)
    await this.uploadPack(archivePath, realmId)

    let { behaviorPacks, resourcePacks } = await this.getWorldContent(realmId)

    behaviorPacks = behaviorPacks.filter(pack => pack.packId !== manifest.header.uuid)

    const newPack = {
      packId: manifest.header.uuid,
      version: JSON.stringify(manifest.header.version),
      position: packPosition,
      isMarketplacePack: false
    }

    behaviorPacks.splice(packPosition, 0, { ...newPack, position: packPosition })

    for (let i = 0; i < behaviorPacks.length; i++) {
      behaviorPacks[i].position = i
    }

    await this.updateWorldContent(realmId, behaviorPacks, resourcePacks)
  }

  async uploadResourcePack(realmId, resourcePackPath, archiveSavePath = path.join(resourcePackPath, "..", "packArchive"), packPosition = 0) {
    const manifestPath = path.join(resourcePackPath, "manifest.json")
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

    const packName = path.basename(resourcePackPath)
    const archivePath = path.join(archiveSavePath, `${packName}.zip`)

    await util.createZip(resourcePackPath, archivePath)
    await this.isPackAccessible(manifest)
    await this.uploadPack(archivePath, realmId)

    let { behaviorPacks, resourcePacks } = await this.getWorldContent(realmId)

    resourcePacks = resourcePacks.filter(pack => pack.packId !== manifest.header.uuid)

    const newPack = {
      packId: manifest.header.uuid,
      version: JSON.stringify(manifest.header.version),
      position: packPosition,
      isMarketplacePack: false
    }

    resourcePacks.splice(packPosition, 0, { ...newPack, position: packPosition })

    for (let i = 0; i < resourcePacks.length; i++) {
      resourcePacks[i].position = i
    }

    await this.updateWorldContent(realmId, behaviorPacks, resourcePacks)
  }



}
