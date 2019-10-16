const axios = require("axios");

const sendDirective = async ({ url, token, requestId }, message) => {
  const data = {
    header: { requestId },
    directive: {
      type: "VoicePlayer.Speak",
      speech: `<speak>${message}</speak>`
    }
  };

  try {
    await axios.post(`${url}/v1/directives`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = { sendDirective };
