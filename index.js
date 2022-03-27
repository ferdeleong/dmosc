const axios = require("axios");
const express = require("express");
const {applicationUrl} = require("./config");
const State = require("./state");
const SVGAudioPlayerBuilder = require("./svg-audio-player-builder");

const authSpotifyUrl = new URL("https://accounts.spotify.com");
const spotifyApiUrl = new URL("https://api.spotify.com")
let state = new State();

const app = express();

app.get("/validate", async (_, res) => {
  authSpotifyUrl.pathname = "/authorize";
  authSpotifyUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID);
  authSpotifyUrl.searchParams.set("scope", "user-read-currently-playing");
  authSpotifyUrl.searchParams.set("response_type", "code");
  authSpotifyUrl.searchParams.set("redirect_uri", `${applicationUrl}/callback`);
  res.status(200).redirect(authSpotifyUrl.toString());
});

app.get("/callback", async (req, res) => {
  const {code} = req.query;
  await state.createToken(code);
  return res.status(200).redirect("/");
});

// Only apply this middleware for endpoints requiring valid tokens.
app.use((_, res, next) => {
  if (state?.isStateValid()) {
    next();
  } else {
    res.status(201).redirect("/validate");
  }
});

app.get("/currently-playing", async (req, res) => {
  spotifyApiUrl.pathname = "/v1/me/player/currently-playing";
  const {data} = await axios.get(spotifyApiUrl.toString(), {
    headers: {
      "Authorization": `Bearer ${state.accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const song = data?.item;
  const svg = await SVGAudioPlayerBuilder.loadTemplate({
    song: song?.name,
    artist: song?.artists[0].name,
    image: song?.album.images[0].url,
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=1");
  return res.status(200).send(svg);
});

app.get("/", (_, res) => {
  res.send("OK").status(200);
});

app.use((_, res) => res.redirect("/currently-playing"));

app.listen(process.env.PORT, () => {
  console.info(`Server ready at port: ${process.env.PORT}`);
});