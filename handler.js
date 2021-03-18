const crypto = require('crypto');

const { MS_SECRET, GIPHY_TOKEN } = process.env;

const bufSecret = Buffer.from(MS_SECRET, 'base64');

const fetch = require('node-fetch');

module.exports.ask = async (event) => {
  try {
    // Retrieve authorization HMAC information
    const auth = event.headers.Authorization;
    // Calculate HMAC on the message we've received using the shared secret
    const msgBuf = Buffer.from(event.body, 'utf8');
    const msgHash = `HMAC ${crypto.createHmac('sha256', bufSecret).update(msgBuf).digest('base64')}`;

    const responseObj = {};

    if (msgHash === auth) {
      responseObj.type = 'AdaptiveCard';

      let tone;
      let answer;
      const randomNum = Math.random();
      if (randomNum < 0.3) {
        tone = 'positive';
        answer = 'The Hoff thinks yes!';
      } else if (randomNum >= 0.3 || randomNum < 0.6) {
        tone = 'unsure';
        answer = 'Hoff\'s not sure.';
      } else if (randomNum >= 0.6 || randomNum < 0.9) {
        tone = 'negative';
        answer = 'That\'s a no from the Hoff.';
      } else if (randomNum >= 0.9) {
        tone = 'thoughtful';
        answer = 'The Hoff needs you to come back later, skater.';
      }

      const offset = Math.floor(Math.random() * 10);
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_TOKEN}&q=${tone} hasselhoff&limit=1&offset=${offset}&rating=g&lang=en`);
      const json = await res.json();
      const imageInfo = json.data[0].images.original;
      responseObj.text = `${answer}<br/><img src="${imageInfo.url}" height="${imageInfo.height}" width="${imageInfo.width}"></img>`;

      console.log(`writing: ${JSON.stringify(responseObj)}`);
      return {
        statusCode: 200,
        body: JSON.stringify(responseObj),
      };
    }

    console.error('could not authenticate message');
    return {
      statusCode: 403,
      body: JSON.stringify({
        type: 'message',
        text: 'Error: message sender cannot be authenticated',
      }),
    };
  } catch (err) {
    console.error(err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: 'message',
        text: err.message,
      }),
    };
  }
};
