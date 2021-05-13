import '../scss/styles.scss';

import { Howl, Howler } from 'howler';

import 'core-js';
import RainRenderer from "./rain-renderer";
import Raindrops from "./raindrops";
import loadImages from "./image-loader";
import createCanvas from "./create-canvas";
import { TweenLite, gsap } from 'gsap';
import times from './times';
import { random, chance } from './random';

var rainSound = new Howl({
  src: ['audio/rain.wav'],
  volume: 0.5,
  loop: true
});

var id = rainSound.play();
rainSound.fade(0, 0.5, 10000, id);

var thunderSound1 = new Howl({
  src: ['audio/thunder1.wav']
});

var thunderSound2 = new Howl({
  src: ['audio/thunder2.wav']
});

var thunderSound3 = new Howl({
  src: ['audio/thunder3.wav']
});

var thunderVolume = 1.0;

function playThunderSound() {
  var options = [thunderSound1, thunderSound2, thunderSound3];
  var choice = options[parseInt(Math.random() * options.length)];
  var id = choice.play();
  choice.volume(thunderVolume, id);
}

document.getElementById("thunder-vol").oninput = function() {
  thunderVolume = this.value/100;
}

document.getElementById("rain-vol").oninput = function() {
  rainSound.volume(this.value/100 * 0.5);
}

document.getElementById("rain-icon").onclick = function() {
  var muted = !this.classList.contains("disabled");
  rainSound.mute(muted);
  if (muted)
    this.classList.add("disabled");
  else
    this.classList.remove("disabled");
}

var isFullscreen = false;
var uiVisible = true;

function openFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

document.getElementById("toggle-fullscreen").onclick = toggleFullscreen;

function toggleFullscreen() {
  if (!isFullscreen)
    openFullscreen();
  else
    closeFullscreen();

  isFullscreen = !isFullscreen;
}

function toggleUI() {
  if (uiVisible)
    gsap.to(".ui", { opacity: 0, display: "none", duration: 1, ease: "power4.easeout" });
  else
    gsap.to(".ui", { opacity: 1, display: "flex", duration: 1, ease: "power4.easeout" });
  
  uiVisible = !uiVisible;
}

document.getElementById("toggle-ui").onclick = toggleUI;

document.onkeypress = (event) => {
  switch (event.code) {
    case "Space":
      toggleUI();
      break;
    case "Enter":
      toggleFullscreen();
      break;
    case "Esc": // IE/Edge specific value
    case "Escape":
      closeFullscreen();
      break;
    default:
      return; // Quit when this doesn't handle the key event.
  }
}

let textureRainFg, textureRainBg,
  textureStormLightningFg, textureStormLightningBg,
  textureFalloutFg, textureFalloutBg,
  textureSunFg, textureSunBg,
  textureDrizzleFg, textureDrizzleBg,
  dropColor, dropAlpha;

let textureFg,
  textureFgCtx,
  textureBg,
  textureBgCtx;

let textureBgSize={
  width:500,
  height:384
}
let textureFgSize={
  width:96,
  height:64
}

let raindrops, renderer, canvas, flashInterval;

let weatherData=null;
let curWeatherData=null;
let blend={v:0};

function loadTextures(){
  loadImages([
    {name:"dropAlpha",src:"img/drop-alpha.png"},
    {name:"dropColor",src:"img/drop-color.png"},

    {name:"textureRainFg",src:"img/weather/city.png"},
    {name:"textureRainBg",src:"img/weather/city.png"},

    {name:"textureStormLightningFg",src:"img/weather/city-flash.png"},
    {name:"textureStormLightningBg",src:"img/weather/city-flash.png"},

    {name:"textureFalloutFg",src:"img/weather/texture-fallout-fg.png"},
    {name:"textureFalloutBg",src:"img/weather/texture-fallout-bg.png"},

    {name:"textureSunFg",src:"img/weather/texture-sun-fg.png"},
    {name:"textureSunBg",src:"img/weather/texture-sun-bg.png"},

    {name:"textureDrizzleFg",src:"img/weather/texture-drizzle-fg.png"},
    {name:"textureDrizzleBg",src:"img/weather/texture-drizzle-bg.png"},
  ]).then((images)=>{
    textureRainFg = images.textureRainFg.img;
    textureRainBg = images.textureRainBg.img;

    textureFalloutFg = images.textureFalloutFg.img;
    textureFalloutBg = images.textureFalloutBg.img;

    textureStormLightningFg = images.textureStormLightningFg.img;
    textureStormLightningBg = images.textureStormLightningBg.img;

    textureSunFg = images.textureSunFg.img;
    textureSunBg = images.textureSunBg.img;

    textureDrizzleFg = images.textureDrizzleFg.img;
    textureDrizzleBg = images.textureDrizzleBg.img;

    dropColor = images.dropColor.img;
    dropAlpha = images.dropAlpha.img;

    init();
  });
}
loadTextures();

function init(){
  //canvas = document.querySelector('#container');
  if (canvas) document.body.removeChild(canvas);

  canvas = document.createElement("canvas");
  canvas.style.position = "absolute";

  let dpi=window.devicePixelRatio;
  canvas.width=window.innerWidth*dpi;
  canvas.height=window.innerHeight*dpi;
  canvas.style.width=window.innerWidth+"px";
  canvas.style.height=window.innerHeight+"px";

  document.body.appendChild(canvas);

  raindrops = new Raindrops(
    canvas.width,
    canvas.height,
    dpi,
    dropAlpha,
    dropColor,{
      trailRate:1,
      trailScaleRange:[0.2,0.45],
      collisionRadius : 0.45,
      dropletsCleaningRadiusMultiplier : 0.28,
    }
  );

  textureFg = createCanvas(textureFgSize.width,textureFgSize.height);
  textureFgCtx = textureFg.getContext('2d');
  textureBg = createCanvas(textureBgSize.width,textureBgSize.height);
  textureBgCtx = textureBg.getContext('2d');

  generateTextures(textureRainFg, textureRainBg);

  renderer = new RainRenderer(canvas, raindrops.canvas, textureFg, textureBg, null,{
    brightness:1.04,
    alphaMultiply:6,
    alphaSubtract:3,
    // minRefraction:256,
    // maxRefraction:512
  });

  setupEvents();
}

function setupEvents(){
  setupWeather();
  setupFlash();
}

function setupFlash() {
  flashInterval = setInterval(() => {
    if(chance(curWeatherData.flashChance)){
      flash(curWeatherData.bg, curWeatherData.fg, curWeatherData.flashBg, curWeatherData.flashFg);
    }
  }, 5000);
}

function setupWeather(){
  setupWeatherData();
  window.addEventListener("hashchange",(event)=>{
    updateWeather();
  });
  updateWeather();
}

function setupWeatherData(){
  let defaultWeather = {
    raining:true,
    minR:20,
    maxR:50,
    rainChance:0.35,
    rainLimit:6,
    dropletsRate:50,
    dropletsSize:[3,5.5],
    trailRate:1,
    trailScaleRange:[0.25,0.35],
    fg:textureRainFg,
    bg:textureRainBg,
    flashFg:textureStormLightningFg,
    flashBg:textureStormLightningBg,
    flashChance:0.1,
    collisionRadiusIncrease:0.0002
  };

  function weather(data){
    return Object.assign({}, defaultWeather, data);
  }

  weatherData = {
    rain:weather({
      rainChance:0.35,
      dropletsRate:50,
      raining:true,
      fg:textureRainFg,
      bg:textureRainBg
    }),
    storm:weather({
      maxR:55,
      rainChance:0.4,
      dropletsRate:80,
      dropletsSize:[3,5.5],
      trailRate:2.5,
      trailScaleRange:[0.25,0.4],
      fg:textureRainFg,
      bg:textureRainBg,
      flashFg:textureStormLightningFg,
      flashBg:textureStormLightningBg,
      flashChance:0.1
    }),
    fallout:weather({
      minR:30,
      maxR:60,
      rainChance:0.35,
      dropletsRate:20,
      trailRate:4,
      fg:textureFalloutFg,
      bg:textureFalloutBg,
      collisionRadiusIncrease:0
    }),
    drizzle:weather({
      minR:10,
      maxR:40,
      rainChance:0.15,
      rainLimit:2,
      dropletsRate:10,
      dropletsSize:[3.5,6],
      fg:textureDrizzleFg,
      bg:textureDrizzleBg
    }),
    sunny:weather({
      rainChance:0,
      rainLimit:0,
      droplets:0,
      raining:false,
      fg:textureSunFg,
      bg:textureSunBg
    }),
  };
}
function updateWeather() {
  let data = weatherData['rain'];
  curWeatherData = data;

  raindrops.options=Object.assign(raindrops.options,data)

  raindrops.clearDrops();

  TweenLite.fromTo(blend,1,{
    v:0
  },{
    v:1,
    onUpdate:()=>{
      generateTextures(data.fg,data.bg,blend.v);
      renderer.updateTextures();
    }
  });
}

function flash(baseBg,baseFg,flashBg,flashFg){
  let flashValue={v:0};
  function transitionFlash(to,t=0.025){
    return new Promise((resolve,reject)=>{
      TweenLite.to(flashValue,t,{
        v:to,
        ease: "power4.out",
        onUpdate:()=>{
          generateTextures(baseFg,baseBg);
          generateTextures(flashFg,flashBg,flashValue.v);
          renderer.updateTextures();
        },
        onComplete:()=>{
          resolve();
        }
      });
    });
  }

  let lastFlash=transitionFlash(1);
  times(random(2,7),(i)=>{
    lastFlash=lastFlash.then(()=>{
      return transitionFlash(random(0.1,1))
    })
  })
  lastFlash=lastFlash.then(()=>{
    return transitionFlash(1,0.1);
  }).then(()=>{
    transitionFlash(0,0.25);
  });

  setTimeout(playThunderSound, 500 + Math.random() * 1000);

}

function generateTextures(fg,bg,alpha=1){
  textureFgCtx.globalAlpha=alpha;
  textureFgCtx.drawImage(fg,0,0,textureFgSize.width,textureFgSize.height);

  textureBgCtx.globalAlpha=alpha;
  textureBgCtx.drawImage(bg,0,0,textureBgSize.width,textureBgSize.height);
}

window.onresize = () => {
  raindrops.cleanup();
  renderer.cleanup();
  clearInterval(flashInterval);
  init();
}
