const h = require('hyperscript')

const SUMMONING_TYPE = 9

const UNKNOWN_SCROLL_ID = 1
const MYSTICAL_SCROLL_ID = 2
const LIGHT_DARK_SCROLL_ID = 3
const WATER_SCROLL_ID = 4
const FIRE_SCROLL_ID = 5
const WIND_SCROLL_ID = 6
const LEGENDARY_SCROLL_ID = 7
const SUMMONING_STONE_ID = 8
const LEGENDARY_PIECE_ID = 9
const LIGHT_DARK_PIECE_ID = 10
const TRANSCENDANCE_SCROLL_ID = 11
const LEGENDARY_WATER_SCROLL_ID = 12
const LEGENDARY_FIRE_SCROLL_ID = 13
const LEGENDARY_WIND_SCROLL_ID = 14

const scrollImageMap = {
  [UNKNOWN_SCROLL_ID]: 'scroll_unknown',
  [MYSTICAL_SCROLL_ID]: 'scroll_mystical',
  [LIGHT_DARK_SCROLL_ID]: 'scroll_light_and_dark',
  [WATER_SCROLL_ID]: 'scroll_water',
  [FIRE_SCROLL_ID]: 'scroll_fire',
  [WIND_SCROLL_ID]: 'scroll_wind',
  [LEGENDARY_SCROLL_ID]: 'scroll_legendary',
  [SUMMONING_STONE_ID]: 'scroll_exclusive',
  [LEGENDARY_PIECE_ID]: 'pieces_legendary',
  [LIGHT_DARK_PIECE_ID]: 'pieces_light_and_dark',
  [TRANSCENDANCE_SCROLL_ID]: 'scroll_transcendance',
  [LEGENDARY_WATER_SCROLL_ID]: 'scroll_unknown',
  [LEGENDARY_FIRE_SCROLL_ID]: 'scroll_unknown',
  [LEGENDARY_WIND_SCROLL_ID]: 'scroll_unknown'
}

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'ShopChecker',
  pluginDescription:
    'Logs the number of summon items in the shop when you refresh.',
  init (proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp)
      }
    })
  },
  processCommand (proxy, req, resp) {
    const { command } = req

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'GetBlackMarketList':
      case 'GetGuildBlackMarketList':
        console.log(JSON.stringify(resp.market_list, null, 2))
        const scrolls = resp.market_list.filter(
          v => v.item_master_type === SUMMONING_TYPE
        )

        const scrollsOutput = scrolls.map(scroll =>
          h(
            'div.item',
            h(
              'div.ui.image.label',
              h('img', {
                src: `../assets/scrolls/${
                  scrollImageMap[scroll.item_master_id]
                }.png`
              }),
              h(
                'span.upgrade',
                `Slot: ${scroll.item_no}. Amount: ${scroll.amount}`
              )
            )
          )
        )

        const list = h('div.ui.list.relaxed', scrollsOutput)

        if (scrolls.length > 0) {
          proxy.log({
            type: 'info',
            source: 'plugin',
            name: this.pluginName,
            message: list.outerHTML
          })
        }
        break

      default:
        break
    }
  },

  logRuneDrop (rune) {
    // console.log(JSON.stringify(gMapping.rune, null, 2))
    console.log(rune)
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
        h('img', {
          src: `../assets/runes/${gMapping.rune.sets[rune.set_id]}.png`
        }),
        h('span.upgrade', `+${rune.upgrade_curr}`)
      ),
      h(
        'div.content',
        starHtml,
        h(
          'div.header',
          `${gMapping.isAncient(rune) ? 'Ancient ' : ''}${
            gMapping.rune.sets[rune.set_id]
          } Rune (${rune.slot_no}) ${
            gMapping.rune.effectTypes[rune.pri_eff[0]]
          }`
        ),
        h(
          'div.description',
          `Efficiency: ${efficiency.current}%. ${
            rune.upgrade_curr < 12 ? `Max: ${efficiency.max}%` : ''
          }`
        )
      )
    )
    return content.outerHTML
  },

  mountStarsHtml (rune) {
    let count = 0
    const star = h(
      'span.star',
      h('img', { src: '../assets/icons/star-unawakened.png' })
    )
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
