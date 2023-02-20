import { MCEvent } from '@managed-components/types'
import { generateUrl, generateUUID, getRandomInt, getRequestBody } from '.'

describe('Impact Radius MC works correctly', () => {
  let fetchedRequests: any = []
  let setCookies: any = []

  const dummyClient = {
    title: 'Zaraz "Test" /t Page',
    timestamp: 1670502437,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    language: 'en-GB',
    referer: '',
    ip: '127.0.0.1',
    emitter: 'browser',
    url: new URL('http://127.0.0.1:1337'),
    fetch: () => undefined,
    set: () => undefined,
    execute: () => undefined,
    return: () => {},
    get: () => undefined,
    attachEvent: () => {},
    detachEvent: () => {},
  }

  const fakeEvent = new Event('event', {}) as MCEvent
  fakeEvent.payload = {}
  fakeEvent.client = dummyClient

  const settings = {
    accountId: 'ir-mc',
    id: 'camp-id',
    iw: '123',
    td: 'https://demoto.xyz',
  }

  it('Generates correct url to send to if event type is identify', () => {
    fakeEvent.name = 'identify'

    const url = new URL(generateUrl('identify', fakeEvent, settings))
    const expectedLink = `${url.origin}${url.pathname}`
    expect(`https://demoto.xyz/cur/camp-id`).toBe(expectedLink)
  })

  it('Generates correct url and payload to send if event type is event', () => {
    fakeEvent.name = 'event'
    fakeEvent.payload = {
      eventId: 'event-id',
    }

    const url = new URL(generateUrl('event', fakeEvent, settings))
    const expectedLink = `${url.origin}${url.pathname}`
    expect(`https://demoto.xyz/xconv/event-id/camp-id`).toBe(expectedLink)

    const params = url.searchParams
    expect(params.get('_ir')).toBeTypeOf('string')
  })
})
