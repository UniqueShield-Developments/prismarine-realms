const Rest = require('./rest')

const Realm = require('./structures/Realm')

class RealmAPI {
  constructor(authflow, platform, options = {}) {
    this.rest = new Rest(authflow, platform, options)
    this.platform = platform
  }

  static from(authflow, platform, options) {
    return new {
      bedrock: require('./bedrock/api')
    }[platform](authflow, platform, options)
  }

  async getRealm(realmId) {
    const data = await this.rest.get(`/worlds/${realmId}`)
    return new Realm(this, data)
  }

  async getRealms() {
    const data = await this.rest.get('/worlds')
    return data.servers.map(realm => new Realm(this, realm))
  }

  async getRealmSubscriptionInfo(realmId, detailed = false) {
    if (detailed) {
      const data = await this.rest.get(`/subscriptions/${realmId}/details`)
      return {
        type: data.type,
        store: data.store,
        startDate: data.startDate,
        endDate: data.endDate,
        renewalPeriod: data.renewalPeriod,
        daysLeft: data.daysLeft,
        subscriptionId: data.subscriptionId
      }
    } else {
      const data = await this.rest.get(`/subscriptions/${realmId}`)
      return {
        startDate: data.startDate,
        daysLeft: data.daysLeft,
        subscriptionType: data.subscriptionType
      }
    }
  }

  async changeRealmState(realmId, state) {
    return await this.rest.put(`/worlds/${realmId}/${state}`)
  }

  async changeRealmActiveSlot(realmId, slotId) {
    return await this.rest.put(`/worlds/${realmId}/slot/${slotId}`)
  }

  async changeRealmNameAndDescription(realmId, name, description) {
    await this.rest.post(`/worlds/${realmId}`, {
      body: {
        name,
        description
      }
    })
  }

  async deleteRealm(realmId) {
    await this.rest.delete(`/worlds/${realmId}`)
  }
}

module.exports = RealmAPI
