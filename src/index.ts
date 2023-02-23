import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'

export const generateUrl = (
  eventType: string,
  event: MCEvent,
  settings: ComponentSettings
) => {
  const { client, payload } = event

  // recreate campaign data in a minimalistic way
  const campaign = {
    v: 'U25', // version
    id: settings.accountId, // account id
    td: settings.td, // tracking domain
    config: {
      id: settings.id, // id
      iw: settings.iw, // inactivity window - session expires after iw
    },
  }

  const sessionCookieName = campaign.config.id
  const uuidCookieName = 'PI'

  const sessionCookie = client.get(sessionCookieName)
  const uuidCookie = client.get(uuidCookieName)

  const timeStamp = new Date().getTime()

  const omap = {
    ordersubtotalprediscount: 'oabd',
    ordersubtotalpostdiscount: 'amount',
    referenceid: 'refid',
    customeremail: 'custemail',
    customerid: 'custid',
    searchterm: 'searchtxt',
    actiontrackerid: 'irchannel',
    eventtypeid: 'irchannel',
    eventtypecode: 'irchannel',
    customercity: 'custct',
    customercountry: 'custctry',
    customerpostcode: 'postcode',
    customerregion: 'custrgn',
    orderrebate: 'rebate',
    orderdiscount: 'odsc',
    money1: 'mny1',
    money2: 'mny2',
    money3: 'mny3',
    date1: 'date1',
    date2: 'date2',
    date3: 'date3',
    numeric1: 'num1',
    numeric2: 'num2',
    numeric3: 'num3',
    text1: 'str1',
    text2: 'str2',
    text3: 'str3',
    orderpromocodedesc: 'pmod',
    orderpromocode: 'pmoc',
    note: 'note',
    siteversion: 'sitever',
    sitecategory: 'sitecat',
    hearaboutus: 'hrau',
    ordershipping: 'st',
    customerstatus: 'cs',
    currencycode: 'currcd',
    ordertax: 'tax',
    giftpurchase: 'gp',
    orderid: 'oid',
    paymenttype: 'pt',
    locationname: 'ln',
    locationtype: 'lt',
    locationid: 'li',
    propertyid: 'propid',
  }

  function setSessionCookie() {
    const sessionCookieUUID = timeStamp + '|0|' + timeStamp + '|||'
    const sessionCookieExpiry =
      new Date().getTime() + campaign.config.iw * 60 * 1000
    client.set(sessionCookieName, sessionCookieUUID, {
      expiry: sessionCookieExpiry,
    })
  }

  function getCurrentSessionId() {
    if (!sessionCookie) {
      setSessionCookie()
      const timezoneOffset = client.timezoneOffset || 0
      const sessionDate = new Date()
      sessionDate.setTime(sessionDate.getTime() - timezoneOffset * 60 * 1000)
      return sessionDate.getTime()
    }
    return sessionCookie.split('|')[2]
  }

  // will set a cookie with the uuid and the session id if it's not already set
  function getUUID() {
    if (uuidCookie) {
      return uuidCookie
    } else {
      const randomUUID = crypto.randomUUID()
      client.set(uuidCookieName, randomUUID)
      setUUIDWithExpiry(randomUUID)
      return randomUUID
    }
  }

  function setUUIDWithExpiry(uuid) {
    const expiryTime = new Date() // calculate expiry time here
    expiryTime.setDate(expiryTime.getDate() + 720)

    client.set(uuidCookieName, uuid, {
      expiry: expiryTime,
    })
  }

  function buildTrackConversionParams() {
    const params = {}
    const hippoUUID = client.get('hippo-uuid') || ''

    params['custid'] = hippoUUID
    if (event.name !== 'identify') {
      params['oid'] = hippoUUID
    }

    for (const [key, value] of Object.entries(settings)) {
      if (omap[key.toLowerCase()]) {
        if (value)
          params[omap[key.toLowerCase()]] = encodeURIComponent(value as any)
      }
    }

    params['_ir'] = encodeURIComponent(
      `${campaign.v}|${getUUID()}|${getCurrentSessionId()}`
    )

    return new URLSearchParams(params).toString()
  }

  const baseUrl = campaign.td
  const params = buildTrackConversionParams()

  if (eventType === 'identify') {
    const url = `${baseUrl}/cur/${campaign.config.id}?${params}`
    return url
  } else {
    const url = `${baseUrl}/xconv/${payload.eventId}/${campaign.config.id}?${params}`
    return url
  }
}

export default async function (manager: Manager, settings: ComponentSettings) {
  manager.addEventListener('identify', (event: MCEvent) => {
    const url = generateUrl('identify', event, settings)

    event.client.fetch(url, {
      method: 'POST',
    })
  })

  manager.addEventListener('event', (event: MCEvent) => {
    const url = generateUrl('event', event, settings)

    event.client.fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-856',
      },
    })
  })
}
