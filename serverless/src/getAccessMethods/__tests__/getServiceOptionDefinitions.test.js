import jwt from 'jsonwebtoken'
import nock from 'nock'

import { getServiceOptionDefinitions } from '../getServiceOptionDefinitions'
import * as getSystemToken from '../../util/urs/getSystemToken'
import * as getEarthdataConfig from '../../../../sharedUtils/config'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getServiceOptionDefinitions', () => {
  test('fetches option definitions from CMR', async () => {
    nock(/cmr/)
      .get(/service_option_definitions/)
      .reply(200, {
        service_option_definition: {
          form: 'mock echo form'
        }
      })

    jest.spyOn(getSystemToken, 'getSystemToken').mockImplementation(() => 'mocked-system-token')
    jest.spyOn(getEarthdataConfig, 'getSecretEarthdataConfig').mockImplementation(() => ({ clientId: 'clientId', secret: 'secret' }))
    jest.spyOn(getEarthdataConfig, 'getEarthdataConfig').mockImplementation(() => ({ cmrHost: 'http://cmr.example.com' }))
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ token: { access_token: 'access_token' } }))

    const serviceOptionDefinitions = [
      {
        id: 'option_def_guid',
        name: 'Service Option Definition'
      }
    ]

    const forms = await getServiceOptionDefinitions(serviceOptionDefinitions, 'mockJwt')

    expect(forms).toEqual([
      {
        esi0: {
          form: 'mock echo form',
          service_option_definition: {
            id: 'option_def_guid',
            name: 'Service Option Definition'
          },
          service_option_definitions: undefined
        }
      }
    ])
  })

  test('fetches multiple option definitions from CMR', async () => {
    nock(/cmr/)
      .get(/service_option_definitions/)
      .reply(200, {
        service_option_definition: {
          form: 'mock echo form 1'
        }
      })
    nock(/cmr/)
      .get(/service_option_definitions/)
      .reply(200, {
        service_option_definition: {
          form: 'mock echo form 2'
        }
      })

    jest.spyOn(getSystemToken, 'getSystemToken').mockImplementation(() => 'mocked-system-token')
    jest.spyOn(getEarthdataConfig, 'getSecretEarthdataConfig').mockImplementation(() => ({ clientId: 'clientId', secret: 'secret' }))
    jest.spyOn(getEarthdataConfig, 'getEarthdataConfig').mockImplementation(() => ({ cmrHost: 'http://cmr.example.com' }))
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ token: { access_token: 'access_token' } }))

    const serviceOptionDefinitions = [
      {
        id: 'service_option_def_guid_1',
        name: 'Service Option Definition'
      },
      {
        id: 'service_option_def_guid_2',
        name: 'Service Option Definition'
      }
    ]

    const forms = await getServiceOptionDefinitions(serviceOptionDefinitions, 'mockJwt')

    expect(forms).toEqual([
      {
        esi0: {
          form: 'mock echo form 1',
          service_option_definition: {
            id: 'service_option_def_guid_1',
            name: 'Service Option Definition'
          },
          service_option_definitions: undefined
        }
      },
      {
        esi1: {
          form: 'mock echo form 2',
          service_option_definition: {
            id: 'service_option_def_guid_2',
            name: 'Service Option Definition'
          },
          service_option_definitions: undefined
        }
      }
    ])
  })
})