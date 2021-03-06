import { fetchOpenAltimetryHandoffUrl } from '../openAltimetry'
import projections from '../../map/projections'

describe('handoffs#openAltimetry', () => {
  test('returns the default root and mapType when no subsetting is provided', () => {
    const collectionMetadata = {}

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?mapType=geographic'
    })
  })

  test('returns the default root and mapType when no subsetting is active', () => {
    const collectionMetadata = {}

    const collectionSearch = {}

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?mapType=geographic'
    })
  })

  test('sets mapType to arctic when the arctic projection is used', () => {
    const collectionMetadata = {}

    const collectionSearch = {}

    const mapProjection = projections.arctic

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch, mapProjection)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?mapType=arctic'
    })
  })

  test('returns the default root and mapType when no subsetting is active', () => {
    const collectionMetadata = {}

    const collectionSearch = {}

    const mapProjection = projections.antarctic

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch, mapProjection)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?mapType=antarctic'
    })
  })

  test('appends temporal values when start and end date are provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      temporal: {
        startDate: '1984-07-02 05:23:00',
        endDate: '1984-07-02 10:43:00'
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?start_date=1984-07-02&end_date=1984-07-02&mapType=geographic'
    })
  })

  test('appends temporal values when only start date is provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      temporal: {
        startDate: '1984-07-02 05:23:00'
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?start_date=1984-07-02&mapType=geographic'
    })
  })

  test('appends temporal values when only end date is provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      temporal: {
        endDate: '2000-07-02 10:43:00'
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?end_date=2000-07-02&mapType=geographic'
    })
  })

  test('appends spatial values when a bounding box is provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      spatial: {
        boundingBox: ['-90.32766723632812,41.63677044970652,-82.2337646484375,48.34205200181264']
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?minx=-90.32766723632812&miny=41.63677044970652&maxx=-82.2337646484375&maxy=48.34205200181264&mapType=geographic'
    })
  })

  test('appends spatial values when a polygon is provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      spatial: {
        polygon: ['-77,38,-77,38,-76,38,-77,38']
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?minx=-77&miny=37.99999999999998&maxx=-76&maxy=38.00105844675541&mapType=geographic'
    })
  })

  test('appends temporal and spatial values when both are provided', () => {
    const collectionMetadata = {}

    const collectionSearch = {
      spatial: {
        boundingBox: ['-90.32766723632812,41.63677044970652,-82.2337646484375,48.34205200181264']
      },
      temporal: {
        startDate: '1984-07-02 05:23:00',
        endDate: '1984-07-02 10:43:00'
      }
    }

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?start_date=1984-07-02&end_date=1984-07-02&minx=-90.32766723632812&miny=41.63677044970652&maxx=-82.2337646484375&maxy=48.34205200181264&mapType=geographic'
    })
  })

  test('appends the product value', () => {
    const collectionMetadata = {
      short_name: 'atl08'
    }

    const collectionSearch = {}

    const response = fetchOpenAltimetryHandoffUrl(collectionMetadata, collectionSearch)

    expect(response).toEqual({
      title: 'Open Altimetry',
      href: 'https://openaltimetry.org/data/icesat2/?product=atl08&mapType=geographic'
    })
  })
})
