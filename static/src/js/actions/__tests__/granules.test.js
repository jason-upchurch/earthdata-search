import nock from 'nock'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import actions from '../index'

import {
  excludeGranule,
  fetchLinks,
  fetchOpendapLinks,
  getProjectGranules,
  getSearchGranules,
  undoExcludeGranule,
  updateGranuleLinks,
  updateGranuleResults
} from '../granules'

import {
  ADD_GRANULE_METADATA,
  EXCLUDE_GRANULE_ID,
  FINISHED_GRANULES_TIMER,
  FINISHED_PROJECT_GRANULES_TIMER,
  LOADED_GRANULES,
  LOADING_GRANULES,
  PROJECT_GRANULES_LOADED,
  PROJECT_GRANULES_LOADING,
  STARTED_GRANULES_TIMER,
  STARTED_PROJECT_GRANULES_TIMER,
  TOGGLE_SPATIAL_POLYGON_WARNING,
  UNDO_EXCLUDE_GRANULE_ID,
  UPDATE_AUTH,
  UPDATE_GRANULE_LINKS,
  UPDATE_GRANULE_RESULTS,
  UPDATE_PROJECT_GRANULE_RESULTS
} from '../../constants/actionTypes'

import CwicGranuleRequest from '../../util/request/cwicGranuleRequest'
import * as EventEmitter from '../../events/events'
import * as mbr from '../../util/map/mbr'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
  jest.clearAllMocks()
})

describe('updateGranuleResults', () => {
  test('should create an action to update the search query', () => {
    const payload = []
    const expectedAction = {
      type: UPDATE_GRANULE_RESULTS,
      payload
    }
    expect(updateGranuleResults(payload)).toEqual(expectedAction)
  })
})

describe('getSearchGranules', () => {
  test('calls the API to get granules', async () => {
    nock(/cmr/)
      .post(/granules/)
      .reply(200, {
        feed: {
          updated: '2019-03-27T20:21:14.705Z',
          id: 'https://cmr.sit.earthdata.nasa.gov:443/search/granules.json?echo_collection_id=collectionId',
          title: 'ECHO granule metadata',
          entry: [{
            mockGranuleData: 'goes here'
          }]
        }
      },
      {
        'cmr-hits': 1
      })

    const store = mockStore({
      authToken: '',
      metadata: {
        collectionId: {
          mock: 'data'
        }
      },
      project: {},
      focusedCollection: 'collectionId',
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getSearchGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[1]).toEqual({
        type: LOADING_GRANULES,
        payload: 'collectionId'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: FINISHED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[4]).toEqual({
        type: LOADED_GRANULES,
        payload: {
          collectionId: 'collectionId',
          loaded: true
        }
      })
      expect(storeActions[5]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [
          {
            mockGranuleData: 'goes here',
            isCwic: false
          }
        ]
      })
      expect(storeActions[6]).toEqual({
        type: UPDATE_GRANULE_RESULTS,
        payload: {
          collectionId: 'collectionId',
          results: [{
            mockGranuleData: 'goes here',
            isCwic: false
          }],
          isCwic: false,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })
    })
  })

  test('calls lambda to get authenticated granules', async () => {
    nock(/localhost/)
      .post(/granules/)
      .reply(200, {
        feed: {
          updated: '2019-03-27T20:21:14.705Z',
          id: 'https://cmr.sit.earthdata.nasa.gov:443/search/granules.json?echo_collection_id=collectionId',
          title: 'ECHO granule metadata',
          entry: [{
            mockGranuleData: 'goes here'
          }]
        }
      },
      {
        'cmr-hits': 1,
        'jwt-token': 'token'
      })

    const store = mockStore({
      authToken: 'token',
      metadata: {
        collections: {
          collectionId: {
            mock: 'data'
          }
        }
      },
      project: {},
      focusedCollection: 'collectionId',
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getSearchGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[1]).toEqual({
        type: LOADING_GRANULES,
        payload: 'collectionId'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: FINISHED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[4]).toEqual({
        type: UPDATE_AUTH,
        payload: 'token'
      })
      expect(storeActions[5]).toEqual({
        type: LOADED_GRANULES,
        payload: {
          collectionId: 'collectionId',
          loaded: true
        }
      })
      expect(storeActions[6]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [
          {
            mockGranuleData: 'goes here',
            isCwic: false
          }
        ]
      })
      expect(storeActions[7]).toEqual({
        type: UPDATE_GRANULE_RESULTS,
        payload: {
          collectionId: 'collectionId',
          results: [{
            mockGranuleData: 'goes here',
            isCwic: false
          }],
          isCwic: false,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })
    })
  })

  test('substitutes MBR for polygon in cwic granule searches', async () => {
    const cwicRequestMock = jest.spyOn(CwicGranuleRequest.prototype, 'search')

    nock(/localhost/)
      .post(/cwic\/granules/)
      .reply(200, '<feed><opensearch:totalResults>1</opensearch:totalResults><entry><title>CWIC Granule</title></entry></feed>')

    const store = mockStore({
      authToken: 'token',
      metadata: {
        collections: {
          collectionId: {
            hasGranules: false,
            tags: {
              'org.ceos.wgiss.cwic.granules.prod': {}
            }
          }
        }
      },
      project: {},
      focusedCollection: 'collectionId',
      query: {
        collection: {
          temporal: {},
          spatial: {
            polygon: ['-77,38,-77,38,-76,38,-77,38']
          }
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getSearchGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[1]).toEqual({
        type: LOADING_GRANULES,
        payload: 'collectionId'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: true
      })
      expect(storeActions[4]).toEqual({
        type: FINISHED_GRANULES_TIMER,
        payload: 'collectionId'
      })
      expect(storeActions[5]).toEqual({
        type: LOADED_GRANULES,
        payload: {
          collectionId: 'collectionId',
          loaded: true
        }
      })
      expect(storeActions[6]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [{
          title: 'CWIC Granule',
          isCwic: true,
          browse_flag: false
        }]
      })
      expect(storeActions[7]).toEqual({
        type: UPDATE_GRANULE_RESULTS,
        payload: {
          collectionId: 'collectionId',
          results: [{
            title: 'CWIC Granule',
            isCwic: true,
            browse_flag: false
          }],
          isCwic: true,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })

      expect(cwicRequestMock).toHaveBeenCalledTimes(1)
      expect(cwicRequestMock.mock.calls[0][0].boundingBox).toEqual('-77,37.99999999999998,-76,38.00105844675541')
    })
  })

  test('does not call updateGranuleResults on error', async () => {
    nock(/cmr/)
      .post(/granules/)
      .reply(500)

    nock(/localhost/)
      .post(/error_logger/)
      .reply(200)

    const store = mockStore({
      authToken: '',
      metadata: {
        collections: {
          collectionId: {
            mock: 'data'
          }
        }
      },
      project: {},
      focusedCollection: 'collectionId',
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    const consoleMock = jest.spyOn(console, 'error').mockImplementationOnce(() => jest.fn())

    await store.dispatch(getSearchGranules()).then(() => {
      expect(consoleMock).toHaveBeenCalledTimes(1)
    })
  })
})

describe('getProjectGranules', () => {
  test('calls the API to get granules', async () => {
    nock(/cmr/)
      .post(/granules/)
      .reply(200, {
        feed: {
          updated: '2019-03-27T20:21:14.705Z',
          id: 'https://cmr.sit.earthdata.nasa.gov:443/search/granules.json?echo_collection_id=collectionId',
          title: 'ECHO granule metadata',
          entry: [{
            mockGranuleData: 'goes here'
          }]
        }
      },
      {
        'cmr-hits': 1
      })

    const store = mockStore({
      authToken: '',
      metadata: {
        collections: {
          'C10000000000-EDSC': {
            mock: 'data'
          }
        }
      },
      project: {
        collections: {
          allIds: ['C10000000000-EDSC'],
          byId: {
            'C10000000000-EDSC': {
              granules: {
                addedGranuleIds: [],
                removedGranuleIds: []
              }
            }
          }
        }
      },
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getProjectGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[1]).toEqual({
        type: PROJECT_GRANULES_LOADING,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: FINISHED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[4]).toEqual({
        type: PROJECT_GRANULES_LOADED,
        payload: {
          collectionId: 'C10000000000-EDSC',
          loaded: true
        }
      })
      expect(storeActions[5]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [
          {
            mockGranuleData: 'goes here',
            isCwic: false
          }
        ]
      })
      expect(storeActions[6]).toEqual({
        type: UPDATE_PROJECT_GRANULE_RESULTS,
        payload: {
          collectionId: 'C10000000000-EDSC',
          results: [{
            mockGranuleData: 'goes here',
            isCwic: false
          }],
          isCwic: false,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })
    })
  })

  test('calls lambda to get authenticated granules', async () => {
    nock(/localhost/)
      .post(/granules/)
      .reply(200, {
        feed: {
          updated: '2019-03-27T20:21:14.705Z',
          id: 'https://cmr.sit.earthdata.nasa.gov:443/search/granules.json?echo_collection_id=collectionId',
          title: 'ECHO granule metadata',
          entry: [{
            mockGranuleData: 'goes here'
          }]
        }
      },
      {
        'cmr-hits': 1,
        'jwt-token': 'token'
      })

    const store = mockStore({
      authToken: 'token',
      metadata: {
        collections: {
          'C10000000000-EDSC': {
            mock: 'data'
          }
        }
      },
      project: {
        collections: {
          allIds: ['C10000000000-EDSC'],
          byId: {
            'C10000000000-EDSC': {
              granules: {
                addedGranuleIds: [],
                removedGranuleIds: []
              }
            }
          }
        }
      },
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getProjectGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[1]).toEqual({
        type: PROJECT_GRANULES_LOADING,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: FINISHED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[4]).toEqual({
        type: UPDATE_AUTH,
        payload: 'token'
      })
      expect(storeActions[5]).toEqual({
        type: PROJECT_GRANULES_LOADED,
        payload: {
          collectionId: 'C10000000000-EDSC',
          loaded: true
        }
      })
      expect(storeActions[6]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [
          {
            mockGranuleData: 'goes here',
            isCwic: false
          }
        ]
      })
      expect(storeActions[7]).toEqual({
        type: UPDATE_PROJECT_GRANULE_RESULTS,
        payload: {
          collectionId: 'C10000000000-EDSC',
          results: [{
            mockGranuleData: 'goes here',
            isCwic: false
          }],
          isCwic: false,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })
    })
  })

  test('substitutes MBR for polygon in cwic granule searches', async () => {
    const cwicRequestMock = jest.spyOn(CwicGranuleRequest.prototype, 'search')

    nock(/localhost/)
      .post(/cwic\/granules/)
      .reply(200, '<feed><opensearch:totalResults>1</opensearch:totalResults><entry><title>CWIC Granule</title></entry></feed>')

    const store = mockStore({
      authToken: 'token',
      metadata: {
        collections: {
          'C10000000000-EDSC': {
            hasGranules: false,
            tags: {
              'org.ceos.wgiss.cwic.granules.prod': {}
            }
          }
        }
      },
      project: {
        collections: {
          allIds: ['C10000000000-EDSC'],
          byId: {
            'C10000000000-EDSC': {
              granules: {
                addedGranuleIds: [],
                removedGranuleIds: []
              }
            }
          }
        }
      },
      query: {
        collection: {
          temporal: {},
          spatial: {
            polygon: '-77,38,-77,38,-76,38,-77,38'
          }
        }
      },
      timeline: {
        query: {}
      }
    })

    await store.dispatch(getProjectGranules()).then(() => {
      const storeActions = store.getActions()
      expect(storeActions[0]).toEqual({
        type: STARTED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[1]).toEqual({
        type: PROJECT_GRANULES_LOADING,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[2]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: false
      })
      expect(storeActions[3]).toEqual({
        type: TOGGLE_SPATIAL_POLYGON_WARNING,
        payload: true
      })
      expect(storeActions[4]).toEqual({
        type: FINISHED_PROJECT_GRANULES_TIMER,
        payload: 'C10000000000-EDSC'
      })
      expect(storeActions[5]).toEqual({
        type: PROJECT_GRANULES_LOADED,
        payload: {
          collectionId: 'C10000000000-EDSC',
          loaded: true
        }
      })
      expect(storeActions[6]).toEqual({
        type: ADD_GRANULE_METADATA,
        payload: [{
          title: 'CWIC Granule',
          isCwic: true,
          browse_flag: false
        }]
      })
      expect(storeActions[7]).toEqual({
        type: UPDATE_PROJECT_GRANULE_RESULTS,
        payload: {
          collectionId: 'C10000000000-EDSC',
          results: [{
            title: 'CWIC Granule',
            isCwic: true,
            browse_flag: false
          }],
          isCwic: true,
          hits: 1,
          singleGranuleSize: 0,
          totalSize: {
            size: '0.0',
            unit: 'MB'
          }
        }
      })

      expect(cwicRequestMock).toHaveBeenCalledTimes(1)
      expect(cwicRequestMock.mock.calls[0][0].boundingBox).toEqual('-77,37.99999999999998,-76,38.00105844675541')
    })
  })

  test('does not call updateGranuleResults on error', async () => {
    nock(/cmr/)
      .post(/granules/)
      .reply(500)

    nock(/localhost/)
      .post(/error_logger/)
      .reply(200)

    const store = mockStore({
      authToken: '',
      metadata: {
        collections: {
          'C10000000000-EDSC': {}
        }
      },
      project: {
        collections: {
          allIds: ['C10000000000-EDSC'],
          byId: {
            'C10000000000-EDSC': {
              granules: {
                addedGranuleIds: [],
                removedGranuleIds: []
              }
            }
          }
        }
      },
      query: {
        collection: {
          temporal: {},
          spatial: {}
        }
      },
      timeline: {
        query: {}
      }
    })

    const consoleMock = jest.spyOn(console, 'error').mockImplementationOnce(() => jest.fn())

    await store.dispatch(getProjectGranules()).then(() => {
      expect(consoleMock).toHaveBeenCalledTimes(1)
    })
  })
})

describe('excludeGranule', () => {
  test('should create an action to update the collection', () => {
    const getSearchGranulesMock = jest.spyOn(actions, 'getSearchGranules')
    getSearchGranulesMock.mockImplementationOnce(() => jest.fn())
    const eventEmitterEmitMock = jest.spyOn(EventEmitter.eventEmitter, 'emit')
    eventEmitterEmitMock.mockImplementation(() => jest.fn())

    const payload = {
      collectionId: 'collectionId',
      granuleId: 'granuleId'
    }

    const expectedAction = {
      type: EXCLUDE_GRANULE_ID,
      payload
    }

    const store = mockStore({
      query: {
        collection: {
          byId: {}
        }
      }
    })

    store.dispatch(excludeGranule(payload))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual(expectedAction)

    expect(getSearchGranulesMock).toBeCalledTimes(1)
    expect(eventEmitterEmitMock).toBeCalledTimes(1)
  })
})

describe('undoExcludeGranule', () => {
  test('should create an action to update the collection', () => {
    const getSearchGranulesMock = jest.spyOn(actions, 'getSearchGranules')
    getSearchGranulesMock.mockImplementationOnce(() => jest.fn())

    const payload = 'collectionId'
    const expectedAction = {
      type: UNDO_EXCLUDE_GRANULE_ID,
      payload
    }

    const store = mockStore()
    store.dispatch(undoExcludeGranule(payload))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual(expectedAction)

    expect(getSearchGranulesMock).toBeCalledTimes(1)
  })
})

describe('updateGranuleLinks', () => {
  test('should create an action to update the granule download parameters', () => {
    const payload = {
      granuleDownloadLinks: []
    }
    const expectedAction = {
      type: UPDATE_GRANULE_LINKS,
      payload
    }
    const store = mockStore()
    store.dispatch(updateGranuleLinks(payload))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual(expectedAction)
  })
})

describe('fetchLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls lambda to get the granules from cmr', async () => {
    nock(/localhost/)
      .post(/granules/)
      .reply(200, {
        feed: {
          entry: [
            {
              links: [
                {
                  rel: 'http://esipfed.org/ns/fedsearch/1.1/data#',
                  type: 'application/x-hdfeos',
                  title: 'This file may be downloaded directly from this link',
                  hreflang: 'en-US',
                  href: 'https://e4ftl01.cr.usgs.gov//MODV6_Dal_E/MOLT/MOD11A1.006/2000.02.24/MOD11A1.A2000055.h20v06.006.2015057071542.hdf'
                },
                {
                  rel: 'http://esipfed.org/ns/fedsearch/1.1/documentation#',
                  type: 'text/html',
                  title: 'This file may be accessed using OPeNDAP directly from this link (OPENDAP DATA)',
                  hreflang: 'en-US',
                  href: 'https://opendap.cr.usgs.gov/opendap/hyrax//MODV6_Dal_E/MOLT/MOD11A1.006/2000.02.24/MOD11A1.A2000055.h20v06.006.2015057071542.hdf'
                },
                {
                  rel: 'http://esipfed.org/ns/fedsearch/1.1/browse#',
                  type: 'image/jpeg',
                  title: 'This Browse file may be downloaded directly from this link (BROWSE)',
                  hreflang: 'en-US',
                  href: 'https://e4ftl01.cr.usgs.gov//WORKING/BRWS/Browse.001/2015.03.10/BROWSE.MOD11A1.A2000055.h20v06.006.2015057071544.1.jpg'
                }
              ]
            }
          ]
        }
      })

    nock(/localhost/)
      .post(/granules/)
      .reply(200, {
        feed: {
          entry: [
            {
              links: [
                {
                  rel: 'http://esipfed.org/ns/fedsearch/1.1/data#',
                  type: 'application/x-hdfeos',
                  title: 'This file may be downloaded directly from this link',
                  hreflang: 'en-US',
                  href: 'https://e4ftl01.cr.usgs.gov//MODV6_Dal_E/MOLT/MOD11A1.006/2000.02.24/MOD11A1.A2000055.h30v12.006.2015057072109.hdf'
                }
              ]
            }
          ]
        }
      })

    const store = mockStore({
      authToken: 'token'
    })

    const params = {
      id: 3,
      environment: 'prod',
      access_method: {
        type: 'download'
      },
      collection_id: 'C10000005-EDSC',
      collection_metadata: {},
      granule_params: {
        echo_collection_id: 'C10000005-EDSC',
        bounding_box: '23.607421875,5.381262277997806,27.7965087890625,14.973184553280502'
      },
      granule_count: 888
    }

    await store.dispatch(fetchLinks(params))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      payload: {
        id: 3,
        links: [
          'https://e4ftl01.cr.usgs.gov//MODV6_Dal_E/MOLT/MOD11A1.006/2000.02.24/MOD11A1.A2000055.h20v06.006.2015057071542.hdf'
        ]
      },
      type: UPDATE_GRANULE_LINKS
    })
    expect(storeActions[1]).toEqual({
      payload: {
        id: 3,
        links: [
          'https://e4ftl01.cr.usgs.gov//MODV6_Dal_E/MOLT/MOD11A1.006/2000.02.24/MOD11A1.A2000055.h30v12.006.2015057072109.hdf'
        ]
      },
      type: UPDATE_GRANULE_LINKS
    })
  })
})

describe('fetchOpendapLinks', () => {
  const mbrSpy = jest.spyOn(mbr, 'mbr')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls lambda to get links from opendap', async () => {
    nock(/localhost/)
      .post(/ous/, (body) => {
        const { params } = body

        delete params.requestId

        // Ensure that the payload we're sending OUS is correct
        return JSON.stringify(params) === JSON.stringify({
          bounding_box: '23.607421875,5.381262277997806,27.7965087890625,14.973184553280502',
          echo_collection_id: 'C10000005-EDSC',
          format: 'nc4',
          variables: ['V1000004-EDSC']
        })
      })
      .reply(200, {
        items: [
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.003.L2.RetStd.v6.0.7.0.G13075064534.hdf.nc',
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.004.L2.RetStd.v6.0.7.0.G13075064644.hdf.nc',
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      })

    const store = mockStore({
      authToken: 'token'
    })

    const params = {
      id: 3,
      environment: 'prod',
      access_method: {
        type: 'OPeNDAP',
        selectedVariables: ['V1000004-EDSC'],
        selectedOutputFormat: 'nc4'
      },
      collection_id: 'C10000005-EDSC',
      collection_metadata: {},
      granule_params: {
        echo_collection_id: 'C10000005-EDSC',
        bounding_box: ['23.607421875,5.381262277997806,27.7965087890625,14.973184553280502']
      },
      granule_count: 3
    }

    await store.dispatch(fetchOpendapLinks(params))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      payload: {
        id: 3,
        links: [
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.003.L2.RetStd.v6.0.7.0.G13075064534.hdf.nc',
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.004.L2.RetStd.v6.0.7.0.G13075064644.hdf.nc',
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      },
      type: UPDATE_GRANULE_LINKS
    })

    expect(mbrSpy).toBeCalledTimes(1)
  })

  test('calls lambda to get links from opendap with excluded granules', async () => {
    nock(/localhost/)
      .post(/ous/, (body) => {
        const { params } = body

        delete params.requestId

        // Ensure that the payload we're sending OUS is correct
        return JSON.stringify(params) === JSON.stringify({
          bounding_box: '23.607421875,5.381262277997806,27.7965087890625,14.973184553280502',
          echo_collection_id: 'C10000005-EDSC',
          exclude_granules: true,
          granules: ['G10000404-EDSC'],
          format: 'nc4',
          variables: ['V1000004-EDSC']
        })
      })
      .reply(200, {
        items: [
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.003.L2.RetStd.v6.0.7.0.G13075064534.hdf.nc',
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.004.L2.RetStd.v6.0.7.0.G13075064644.hdf.nc',
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      })

    const store = mockStore({
      authToken: 'token'
    })

    const params = {
      id: 3,
      environment: 'prod',
      access_method: {
        type: 'OPeNDAP',
        selectedVariables: ['V1000004-EDSC'],
        selectedOutputFormat: 'nc4'
      },
      collection_id: 'C10000005-EDSC',
      collection_metadata: {},
      granule_params: {
        echo_collection_id: 'C10000005-EDSC',
        bounding_box: ['23.607421875,5.381262277997806,27.7965087890625,14.973184553280502'],
        exclude: {
          concept_id: ['G10000404-EDSC']
        }
      },
      granule_count: 3
    }

    await store.dispatch(fetchOpendapLinks(params))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      payload: {
        id: 3,
        links: [
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.003.L2.RetStd.v6.0.7.0.G13075064534.hdf.nc',
          'https://f5eil01.edn.ecs.nasa.gov/opendap/DEV01/FS2/AIRS/AIRX2RET.006/2009.01.08/AIRS.2009.01.08.004.L2.RetStd.v6.0.7.0.G13075064644.hdf.nc',
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      },
      type: UPDATE_GRANULE_LINKS
    })

    expect(mbrSpy).toBeCalledTimes(1)
  })

  test('calls lambda to get links from opendap when using additive model', async () => {
    nock(/localhost/)
      .post(/ous/, (body) => {
        const { params } = body

        delete params.requestId

        // Ensure that the payload we're sending OUS is correct
        return JSON.stringify(params) === JSON.stringify({
          bounding_box: '23.607421875,5.381262277997806,27.7965087890625,14.973184553280502',
          echo_collection_id: 'C10000005-EDSC',
          granules: ['G10000003-EDSC'],
          format: 'nc4',
          variables: ['V1000004-EDSC']
        })
      })
      .reply(200, {
        items: [
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      })

    const store = mockStore({
      authToken: 'token'
    })

    const params = {
      id: 3,
      environment: 'prod',
      access_method: {
        type: 'OPeNDAP',
        selectedVariables: ['V1000004-EDSC'],
        selectedOutputFormat: 'nc4'
      },
      collection_id: 'C10000005-EDSC',
      collection_metadata: {},
      granule_params: {
        concept_id: ['G10000003-EDSC'],
        echo_collection_id: 'C10000005-EDSC',
        bounding_box: ['23.607421875,5.381262277997806,27.7965087890625,14.973184553280502']
      },
      granule_count: 1
    }

    await store.dispatch(fetchOpendapLinks(params))
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      payload: {
        id: 3,
        links: [
          'https://airsl2.gesdisc.eosdis.nasa.gov/opendap/Aqua_AIRS_Level2/AIRX2RET.006/2009/008/AIRS.2009.01.08.005.L2.RetStd.v6.0.7.0.G13075064139.hdf.nc'
        ]
      },
      type: UPDATE_GRANULE_LINKS
    })

    expect(mbrSpy).toBeCalledTimes(1)
  })
})
