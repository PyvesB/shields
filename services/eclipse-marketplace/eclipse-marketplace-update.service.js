'use strict'

const Joi = require('joi')
const EclipseMarketplaceBase = require('./eclipse-marketplace-base')
const { formatDate } = require('../../lib/text-formatters')
const { age: ageColor } = require('../../lib/color-formatters')
const { nonNegativeInteger } = require('../validators.js')

const updateResponseSchema = Joi.object({
  marketplace: Joi.object({
    node: Joi.array()
      .items(
        Joi.object({
          changed: Joi.array()
            .items(nonNegativeInteger)
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),
}).required()

module.exports = class EclipseMarketplaceUpdate extends EclipseMarketplaceBase {
  static get category() {
    return 'other'
  }

  static get defaultBadgeData() {
    return { label: 'updated' }
  }

  static get examples() {
    return [
      {
        title: 'Eclipse Marketplace',
        exampleUrl: 'notepad4e',
        urlPattern: ':name',
        staticExample: this.render({ date: 1535779262000 }),
      },
    ]
  }

  static get url() {
    return this.buildUrl('eclipse-marketplace/last-update')
  }

  static render({ date }) {
    return {
      message: formatDate(date),
      color: ageColor(date),
    }
  }

  async handle({ name }) {
    const { marketplace } = await this.fetch({
      name,
      schema: updateResponseSchema,
    })
    const date = 1000 * parseInt(marketplace.node[0].changed[0])
    return this.constructor.render({ date })
  }
}
