'use strict'

const Joi = require('joi')
const chai = require('chai')
const { expect } = chai

const BaseJsonService = require('./base-json')

chai.use(require('chai-as-promised'))

const dummySchema = Joi.object({
  requiredString: Joi.string().required(),
}).required()

class DummyJsonService extends BaseJsonService {
  static get category() {
    return 'cat'
  }

  static get url() {
    return {
      base: 'foo',
    }
  }

  async handle() {
    const { requiredString } = await this._requestJson({ schema: dummySchema })
    return { message: requiredString }
  }
}

describe('BaseJsonService', function() {
  it('handles json responses', async function() {
    const sendAndCacheRequest = async () => ({
      buffer: '{"requiredString": "some-string"}',
      res: { statusCode: 200 },
    })
    const serviceInstance = new DummyJsonService(
      { sendAndCacheRequest },
      { handleInternalErrors: false }
    )
    const serviceData = await serviceInstance.invokeHandler({}, {})
    expect(serviceData).to.deep.equal({
      message: 'some-string',
    })
  })

  it('handles unparseable json responses', async function() {
    const sendAndCacheRequest = async () => ({
      buffer: 'not json',
      res: { statusCode: 200 },
    })
    const serviceInstance = new DummyJsonService(
      { sendAndCacheRequest },
      { handleInternalErrors: false }
    )
    const serviceData = await serviceInstance.invokeHandler({}, {})
    expect(serviceData).to.deep.equal({
      color: 'lightgray',
      message: 'unparseable json response',
    })
  })
})
