const axios = require("axios");
const fs = require("fs");
const path = require("path");

const AUDIO_BARS = 80;

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
              overflow-y: hidden;
            }
            
            #information-container {
              width: 70%;
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
              margin-bottom: 20px;
              animation: ${values.artist ? "horizontal-tape 10s" : "none"};
            }
            
            #album-image {
              border-radius: 5px;
            }
            
            #bars-container {
              width: 100%;
              height: 30px;
              bottom: 1px;
              position: absolute;
              margin: 0;
              padding: 0;
              overflow-y: hidden;
            }
            
            .bar {
              width: 3px;
              bottom: 2px;
              height: 5px;
              position: absolute;
              background: #FAFA33;
              animation: audio-bar-pop 0ms -800ms linear infinite alternate;
            }
            
            ${(() => {
              let css = "";
              let offset = 1;
              for (let i = 1; i <= AUDIO_BARS; ++i) {
                css += `
                  .bar:nth-child(${i}) {
                    left: ${offset}px;
                    animation-duration: ${Math.floor(Math.random() * (1350 - 800 + 1)) + 800}ms;
                  }
                `;
                offset += 4;
              }
              return css;
            })()}
            
            @keyframes horizontal-tape {
              0% {
                transform: translateX(-100%);
              }
              30% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(0%);
              }
            }
            
            @keyframes audio-bar-pop {
              0% {
                height: 5px;
                opacity: .2;
              }
              100% {
                height: 20px;
                opacity: 0.95;
              }
            }
          </style>
          <div id="player-container">
            <img id="album-image" src="${base64}" alt="Album\'s image" width="100" height="100" />
            <div id="information-container">
              <label id="song-name-label">${values?.song ?? "-"}</label>
              <label id="artist-name-label">${values?.artist ?? "-"}</label>
              <div id="bars-container">
                ${Array.from(Array(AUDIO_BARS)).reduce((css) => css + "<div class='bar'></div>", "")}
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `;
  }
}

module.exports = SVGAudioPlayerBuilder;