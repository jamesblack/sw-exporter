const h = require('hyperscript')

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'RuneDropEfficiency',
  pluginDescription: 'Logs the maximum possible efficiency for runes as they drop.',
  init (proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp)
      }
    })
  },
  processCommand (proxy, req, resp) {
    const { command } = req
    let runesInfo = []

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
      case 'BattleDimensionHoleDungeonResult':
        if (resp.win_lose === 1) {
          const reward = resp.reward ? resp.reward : {}

          if (reward.crate && reward.crate.rune) {
            runesInfo.push(this.logRuneDrop(reward.crate.rune))
          }
        }
        break
      case 'BattleDungeonResult_V2':
        if (resp.win_lose === 1) {
          const rewards = resp.changed_item_list ? resp.changed_item_list : []

          if (rewards) {
            rewards.forEach(reward => {
              if (reward.type === 8) {
                runesInfo.push(this.logRuneDrop(reward.info))
              }
            })
          }
        }
        break
      case 'UpgradeRune': {
        const originalLevel = req.upgrade_curr
        const newLevel = resp.rune.upgrade_curr

        if (newLevel > originalLevel && newLevel % 3 === 0 && newLevel <= 12) {
          runesInfo.push(this.logRuneDrop(resp.rune))
        }
        break
      }
      case 'AmplifyRune':
      case 'AmplifyRune_v2':
      case 'ConvertRune':
      case 'ConvertRune_v2':
      case 'ConfirmRune':
        runesInfo.push(this.logRuneDrop(resp.rune))
        break

      case 'BuyBlackMarketItem':
        if (resp.runes && resp.runes.length === 1) {
          runesInfo.push(this.logRuneDrop(resp.runes[0]))
        }
        break

      case 'BuyGuildBlackMarketItem':
        if (resp.runes && resp.runes.length === 1) {
          runesInfo.push(this.logRuneDrop(resp.runes[0]))
        }
        break

      case 'BuyShopItem':
        if (resp.reward && resp.reward.crate && resp.reward.crate.runes) {
          runesInfo.push(this.logRuneDrop(resp.reward.crate.runes[0]))
        }
        break

      case 'GetBlackMarketList':
        resp.market_list.forEach(item => {
          if (item.item_master_type === 8 && item.runes) {
            runesInfo.push(this.logRuneDrop(item.runes[0]))
          }
        })
        break

      case 'GetGuildBlackMarketList':
        resp.market_list.forEach(item => {
          if (item.item_master_type === 8 && item.runes) {
            runesInfo.push(this.logRuneDrop(item.runes[0]))
          }
        })
        break

      case 'BattleWorldBossResult': {
        const reward = resp.reward ? resp.reward : {}

        if (reward.crate && reward.crate.runes) {
          reward.crate.runes.forEach(rune => {
            runesInfo.push(this.logRuneDrop(rune))
          })
        }
        break
      }
      case 'BattleRiftDungeonResult':
        if (resp.item_list) {
          resp.item_list.forEach(item => {
            if (item.type === 8) {
              runesInfo.push(this.logRuneDrop(item.info))
            }
          })
        }
        break

      default:
        break
    }

    if (runesInfo.length > 0) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: this.mountRuneListHtml(runesInfo)
      })
    }
  },

  logRuneDrop (rune) {
    const efficiency = gMapping.getRuneEfficiency(rune)
    const runeQuality = gMapping.rune.quality[rune.rank]
    const colorTable = {
      Common: 'grey',
      Magic: 'green',
      Rare: 'blue',
      Hero: 'purple',
      Legend: 'orange'
    }

    let color = colorTable[runeQuality]
    let starHtml = this.mountStarsHtml(rune)
    const content = h(
      'div.rune.item',
      h(
        `div.ui.image.${color}.label`,
        h('img', { src: `../assets/runes/${gMapping.rune.sets[rune.set_id]}.png` }),
        h('span.upgrade', `+${rune.upgrade_curr}`)
      ),
      h(
        'div.content',
        starHtml,
        h(
          'div.header',
          `${gMapping.isAncient(rune) ? 'Ancient ' : ''}${gMapping.rune.sets[rune.set_id]} Rune (${rune.slot_no}) ${
            gMapping.rune.effectTypes[rune.pri_eff[0]]
          }`
        ),
        h('div.description', `Efficiency: ${efficiency.current}%. ${rune.upgrade_curr < 12 ? `Max: ${efficiency.max}%` : ''}`)
      )
    )
    return content.outerHTML
  },

  mountStarsHtml (rune) {
    let count = 0
    const star = h('span.star', h('img', { src: '../assets/icons/star-unawakened.png' }))
    let html = '<div class="star-line">'
    let runeClass = gMapping.isAncient(rune) ? rune.class - 10 : rune.class

    const stars = []

    while (count < runeClass) {
      stars.push(star)
      count += 1
    }

    return h('div.star-line', stars)
  },

  mountRuneListHtml (runes) {
    let message = '<div class="runes ui list relaxed">'

    runes.forEach(rune => {
      message = message.concat(rune)
    })

    return message.concat('</div>')
  }
}
