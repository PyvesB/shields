'use strict'

const Joi = require('joi')
const EclipseMarketplaceBase = require('./eclipse-marketplace-base')
const { metric } = require('../../lib/text-formatters')
const {
  downloadCount: downloadCountColor,
} = require('../../lib/color-formatters')
const { nonNegativeInteger } = require('../validators.js')

const monthlyResponseSchema = Joi.object({
  marketplace: Joi.object({
    node: Joi.array()
      .items(
        Joi.object({
          installsrecent: Joi.array()
            .items(nonNegativeInteger)
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),
}).required()

const totalResponseSchema = Joi.object({
  marketplace: Joi.object({
    node: Joi.array()
      .items(
        Joi.object({
          installstotal: Joi.array()
            .items(nonNegativeInteger)
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),
}).required()

function DownloadsForInterval(interval) {
  const { base, schema, messageSuffix = '' } = {
    month: {
      base: 'eclipse-marketplace/dm',
      messageSuffix: '/month',
      schema: monthlyResponseSchema,
    },
    total: {
      base: 'eclipse-marketplace/dt',
      schema: totalResponseSchema,
    },
  }[interval]

  return class EclipseMarketplaceDownloads extends EclipseMarketplaceBase {
    static get category() {
      return 'downloads'
    }

    static get examples() {
      return [
        {
          title: 'Eclipse Marketplace',
          exampleUrl: 'notepad4e',
          urlPattern: ':name',
          staticExample: this.render({ downloads: 30000 }),
        },
      ]
    }

    static get url() {
      return this.buildUrl(base)
    }

    static render({ downloads }) {
      return {
        message: `${metric(downloads)}${messageSuffix}`,
        color: downloadCountColor(downloads),
      }
    }

    async handle({ name }) {
      const { marketplace } = await this.fetch({ name, schema })
      const downloads = base.endsWith('dt')
        ? marketplace.node[0].installstotal[0]
        : marketplace.node[0].installsrecent[0]
      return this.constructor.render({ downloads })
    }
  }
}

module.exports = ['month', 'total'].map(DownloadsForInterval)
