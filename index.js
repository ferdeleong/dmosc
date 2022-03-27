const axios = require("axios");
const express = require("express");
const {applicationUrl} = require("./config");
const State = require("./state");
const SvgLoader = require("./svg-loader");

const authSpotifyUrl = new URL("https://accounts.spotify.com");
const spotifyApiUrl = new URL("https://api.spotify.com")
let state = new State();

const app = express();

app.get("/validate", async (_, res) => {
  authSpotifyUrl.pathname = "/authorize";
  authSpotifyUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID);
  authSpotifyUrl.searchParams.set("scope", "user-read-currently-playing user-read-recently-played");
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
app.use(async (_, res, next) => {
  if (state?.isStateValid()) {
    if (state.shouldHydrate()) {
      console.log("💧 Hydrating token");
      await state.hydrateToken();
    }
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

  if (!data || !data?.is_playing || !data?.item?.name) {
    return res.status(301).redirect("/recently-played");
  }

  const song = data?.item;
  const svg = await SvgLoader.loadTemplate({
    song: song?.name,
    artist: song?.artists[0].name,
    image: song?.album.images[0].url,
    isCurrent: true,
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=1");
  return res.status(200).send(svg);
});

app.get("/recently-played", async (req, res) => {
  spotifyApiUrl.pathname = "/v1/me/player/recently-played";
  const {data} = await axios.get(spotifyApiUrl.toString(), {
    headers: {
      "Authorization": `Bearer ${state.accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const size = data?.items.length;
  const song = data?.items[Math.floor(Math.random() * (size - 1))]?.track;
  const svg = await SvgLoader.loadTemplate({
    song: song?.name,
    artist: song?.artists[0].name,
    image: song?.album.images[0].url,
    isCurrent: false,
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=1");
  return res.status(200).send(svg);
});

app.get("/", (_, res) => {
  res.send("OK").status(200);
});

app.listen(process.env.PORT, () => {
  console.info(`Server ready at port: ${process.env.PORT}`);
});