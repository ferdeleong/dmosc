const axios = require("axios");
const fs = require("fs");
const path = require("path");

function isUrlValid(word) {
  let url;
  try {
    url = new URL(word);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

async function loadImageAsBase64(url) {
  if (isUrlValid(url)) {
    const payload = await axios.get(url, {responseType: "arraybuffer"});
    if (payload?.data) {
      const buffer = Buffer.from(payload.data, "utf-8").toString("base64");
      return `data:image/png;base64, ${buffer}`;
    }
  }
  const placeHolder = fs.readFileSync(path.join(__dirname, "static/placeholder.txt"), "utf-8");
  return `data:image/png;base64, ${placeHolder.toString()}`;
}

class SVGAudioPlayerBuilder {
  static async loadTemplate(values) {
    const base64 = await loadImageAsBase64(values?.image);
    return `
    <svg width="500" height="133" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="500" height="133">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>
            * {
              font-family: Helvetica, serif;
            }
            
            #player-container {
              display: flex;
              padding: 10px;
              margin: 10px;
              width: 90%;
              background-color: #6667AB;
              border-radius: 5px;
            }
            
            #information-container {
              width: 45%;
              margin-left: 20px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              overflow-x: hidden;
            }
            
            #song-name-label {
              font-weight: bolder;
              font-size: large;
              margin-bottom: 8px;
              color: white;
            }
            
            #artist-name-label {
              width: 100%;
              display: inline-block;
              font-weight: bold;
              color: darkred;
              animation: ${values.artist ? "horizontal-tape 10s infinite" : "none"};
            }
            
            #album-image {
              border-radius: 5px;
            }
            
            @keyframes horizontal-tape {
              0% {
                transform: translateX(-100%);
              }
              30% {
                transform: translateX(0%);
              }
              60% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(150%);
              }
            }
          </style>
          <div id="player-container">
            <img id="album-image" src="${base64}" alt="Album\'s image" width="100" height="100" />
            <div id="information-container">
              <label id="song-name-label">${values?.song ?? "-"}</label>
              <label id="artist-name-label">${values?.artist ?? "-"}</label>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `;
  }
}

module.exports = SVGAudioPlayerBuilder;