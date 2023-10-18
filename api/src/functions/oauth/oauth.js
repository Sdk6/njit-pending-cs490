import {logger} from "src/lib/logger";

export const handler = async (event, _context) => {
  switch (event.path) {
    case '/oauth/callback':
      return await callback(event)
    default:
      // Whatever this is, it's not correct, so return "Not Found"
      return {
        statusCode: 404,
      }
  }
}

const callback = async (event) => {
  const { code } = event.queryStringParameters
  logger.info(code);

  const response = await fetch(`https://oauth2.googleapis.com/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      code: code,
      grant_type: 'authorization_code'
    }),
  })

  const { access_token, token_type, scope, error } = JSON.parse(await response.text())

  if (error) {
    return { statuscode: 400, body: error }
  }

  try {
    const providerUser = await getProviderUser(access_token)
    return {
      body: JSON.stringify(providerUser)
    }
  } catch (e) {
    return { statuscode: 500, body: e.message }
  }
}

const getProviderUser = async (token) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.text()

  return body
}
