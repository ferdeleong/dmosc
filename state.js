require('dotenv').config();
const axios = require("axios");
const {applicationUrl} = require("./config");

const authorizationPayload = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`);
const authSpotifyUrl = new URL("https://accounts.spotify.com");

authSpotifyUrl.pathname = "/api/token";

class State {
  accessToken = undefined;
  refreshToken = undefined;
  issuedAt = undefined;

  constructor() {
    this.refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    if (this.refreshToken) {
      this.hydrateToken()
        .then(() => console.log("🔑 Spotify token authentication ready."))
        .catch(console.log);
    }
  }

  isStateValid = () => {
    return this.accessToken && this.refreshToken && this.issuedAt;
  };

  shouldHydrate = () => {
    const now = new Date().getTime();
    return (now - this.issuedAt) > 3600 * 1000; // As milliseconds
  };

  createToken = async (code) => {
    const { data } = await axios.post(
      authSpotifyUrl.toString(),
      `grant_type=authorization_code&code=${code}&redirect_uri=${applicationUrl}/callback`,
      {
        headers: {
          "Authorization": `Basic ${authorizationPayload.toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
      }
    );
    this.accessToken = data['access_token'];
    this.refreshToken = data['refresh_token'];
    this.issuedAt = new Date().getTime();
  };

  hydrateToken = async () => {
    const { data } = await axios.post(
      authSpotifyUrl.toString(),
      `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
      {
        headers: {
          "Authorization": `Basic ${authorizationPayload.toString("base64")}`,
        },
      }
    );
    this.accessToken = data['access_token'];
    this.issuedAt = new Date().getTime();
  };
}

module.exports = State;