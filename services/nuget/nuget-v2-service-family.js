import Joi from 'joi'
import queryString from 'query-string'
import { nonNegativeInteger } from '../validators.js'
import {
  BaseJsonService,
  BaseXmlService,
  NotFound,
  redirector,
  pathParams,
  pathParam,
  queryParam,
} from '../index.js'
import {
  renderVersionBadge,
  renderDownloadBadge,
  odataToObject,
} from './nuget-helpers.js'

function createFilter({ packageName, includePrereleases }) {
  const releaseTypeFilter = includePrereleases
    ? 'IsAbsoluteLatestVersion eq true'
    : 'IsLatestVersion eq true'
  return `Id eq '${packageName}' and ${releaseTypeFilter}`
}

const versionSchema = Joi.alternatives(Joi.string(), Joi.number())

const jsonSchema = Joi.object({
  d: Joi.object({
    results: Joi.array()
      .items(
        Joi.object({
          Version: versionSchema,
          NormalizedVersion: Joi.string(),
          DownloadCount: nonNegativeInteger,
        }),
      )
      .max(1)
      .default([]),
  }).required(),
}).required()

const xmlSchema = Joi.object({
  feed: Joi.object({
    entry: Joi.object({
      'm:properties': Joi.object({
        'd:Version': versionSchema,
        'd:NormalizedVersion': Joi.string(),
        'd:DownloadCount': nonNegativeInteger,
        'd:Tags': Joi.string(),
      }),
    }),
  }).required(),
}).required()

const queryParamSchema = Joi.object({
  include_prereleases: Joi.equal(''),
}).required()

async function fetch(
  serviceInstance,
  { odataFormat, baseUrl, packageName, includePrereleases = false },
) {
  const url = `${baseUrl}/Packages()`
  const searchParams = queryString.stringify(
    {
      $filter: createFilter({ packageName, includePrereleases }),
    },
    { encode: false },
  )

  let packageData
  if (odataFormat === 'xml') {
    const data = await serviceInstance._requestXml({
      schema: xmlSchema,
      url: `${url}?${searchParams}`,
    })
    packageData = odataToObject(data.feed.entry)
  } else if (odataFormat === 'json') {
    const data = await serviceInstance._requestJson({
      schema: jsonSchema,
      url: `${url}?${searchParams}`,
      options: {
        headers: { Accept: 'application/atom+json,application/json' },
      },
    })
    packageData = data.d.results[0]
  } else {
    throw Error(`Unsupported Atom OData format: ${odataFormat}`)
  }

  if (packageData) {
    return packageData
  } else if (!includePrereleases) {
    return fetch(serviceInstance, {
      odataFormat,
      baseUrl,
      packageName,
      includePrereleases: true,
    })
  } else {
    throw new NotFound()
  }
}

/*
 * Create a version and download service for a NuGet v2 API. Return an object
 * containing both services.
 *
 * defaultLabel: The label for the left hand side of the badge.
 * serviceBaseUrl: The base URL for the Shields service, e.g. chocolatey, resharper
 * apiBaseUrl: The complete base URL of the API, e.g. https://api.example.com/api/v2
 */
function createServiceFamily({
  title,
  name = title,
  defaultLabel,
  serviceBaseUrl,
  apiBaseUrl,
  odataFormat,
  examplePackageName,
  exampleVersion,
  examplePrereleaseVersion,
  exampleDownloadCount,
}) {
  let Base
  if (odataFormat === 'xml') {
    Base = BaseXmlService
  } else if (odataFormat === 'json') {
    Base = BaseJsonService
  } else {
    throw Error(`Unsupported Atom OData format: ${odataFormat}`)
  }

  class NugetVersionService extends Base {
    static name = `${name}Version`

    static category = 'version'

    static route = {
      base: `${serviceBaseUrl}/v`,
      pattern: ':packageName',
      queryParamSchema,
    }

    static get openApi() {
      if (!title) return {}

      const key = `/${serviceBaseUrl}/v/{packageName}`
      const route = {}
      route[key] = {
        get: {
          summary: `${title} Version`,
          parameters: [
            pathParam({ name: 'packageName', example: examplePackageName }),
            queryParam({
              name: 'include_prereleases',
              schema: { type: 'boolean' },
              example: null,
            }),
          ],
        },
      }
      return route
    }

    static defaultBadgeData = {
      label: defaultLabel,
    }

    static render(props) {
      return renderVersionBadge(props)
    }

    async handle({ packageName }, queryParams) {
      const packageData = await fetch(this, {
        odataFormat,
        baseUrl: apiBaseUrl,
        packageName,
        includePrereleases: queryParams.include_prereleases !== undefined,
      })
      const version = packageData.NormalizedVersion || `${packageData.Version}`
      return this.constructor.render({ version })
    }
  }

  const NugetVersionRedirector = redirector({
    category: 'version',
    route: {
      base: `${serviceBaseUrl}/vpre`,
      pattern: ':packageName',
    },
    transformPath: ({ packageName }) => `/${serviceBaseUrl}/v/${packageName}`,
    transformQueryParams: params => ({
      include_prereleases: null,
    }),
    dateAdded: new Date('2019-12-15'),
  })

  class NugetDownloadService extends Base {
    static name = `${name}Downloads`

    static category = 'downloads'

    static route = {
      base: serviceBaseUrl,
      pattern: 'dt/:packageName',
    }

    static get openApi() {
      if (!title) return {}

      const key = `/${serviceBaseUrl}/dt/{packageName}`
      const route = {}
      route[key] = {
        get: {
          summary: `${title} Downloads`,
          parameters: pathParams({
            name: 'packageName',
            example: examplePackageName,
          }),
        },
      }
      return route
    }

    static render(props) {
      return renderDownloadBadge(props)
    }

    async handle({ packageName }) {
      const packageData = await fetch(this, {
        odataFormat,
        baseUrl: apiBaseUrl,
        packageName,
      })
      const { DownloadCount: downloads } = packageData
      return this.constructor.render({ downloads })
    }
  }

  return { NugetVersionService, NugetVersionRedirector, NugetDownloadService }
}

export { createFilter, fetch, createServiceFamily }
