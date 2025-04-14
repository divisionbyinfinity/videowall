// --------------------------
// Debug logging override (enabled only on localhost)
// --------------------------
const isDebug = (window.location.hostname === "localhost");
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

if (isDebug) {
  console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    const msg = args.join(" ");
    appendDebugLog(msg);
  };
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const msg = args.join(" ");
    appendDebugLog("ERROR: " + msg);
  };
}

// Append message to debug.log on the server via POST.
// Note: This requires a server endpoint at "/debug.log".
function appendDebugLog(message) {
  const timestamp = new Date().toLocaleString();
  const fullMessage = message + " " + timestamp + "\n";
  fetch("debug.log", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: fullMessage
  }).catch(err => {
    originalConsoleError("Failed to write to debug.log", err);
  });
}

// --------------------------
// Helper functions to load files
// --------------------------
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching ${url}: ${res.statusText}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching ${url}: ${res.statusText}`);
  return res.text();
}

// --------------------------
// Load configuration and index CSV
// --------------------------
async function loadConfig() {
  return await fetchJSON('config.json');
}

async function loadSlideIndex(csvPath) {
  const csvData = await fetchText(csvPath);
  const lines = csvData
    .split(/[\r\n,]+/)
    .map(s => s.trim())
    .filter(s => s !== '');
  lines.forEach(line => console.log("Index line read: " + line));
  return lines;
}

// --------------------------
// Template & Slide Building Functions
// --------------------------
function appendTemplates(headHTML, layoutHTML) {
  document.head.innerHTML += headHTML;
  document.body.innerHTML = layoutHTML;
}

function createSlideContent(slideData, config) {
  const parent = document.getElementById('slideshow_parent');
  if (!parent) return;
  parent.innerHTML = '';

  Object.keys(slideData).forEach(key => {
    if (!key.startsWith('element_')) return;

    const elementData = slideData[key];
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-item';
    gridItem.id = key;
    parent.appendChild(gridItem);

    const items = Object.keys(elementData).map(itemKey => {
      const item = elementData[itemKey];
      let mediaElement;

      if (item.contentType === 'image') {
        mediaElement = document.createElement('img');
        mediaElement.src = `${config.image}/${item.content}`;
      } else if (item.contentType === 'video') {
        mediaElement = document.createElement('video');
        mediaElement.src = `${config.video}/${item.content}`;
        mediaElement.autoplay = false;
        mediaElement.loop = false;
        mediaElement.muted = false;
      }

      return {
        mediaElement: mediaElement,
        duration: item.item_duration,
        qrId: item.qrId,
        qrFile: item.qrFile,
        altId: item.altId,
        altFile: item.altFile,
        altBg: item.altBg,
        titleClass: item.titleClass,
        slideTitle: item.slideTitle,
        description: item.description
      };
    });

    let currentItemIndex = 0;
    let elapsedTime = 0;
    const totalSlideDuration = slideData.duration;

    function showItem(index) {
      // Stop previous video if it exists
      if (gridItem.firstChild && gridItem.firstChild.tagName === 'VIDEO') {
        gridItem.firstChild.pause();
        gridItem.firstChild.currentTime = 0;
      }

      gridItem.innerHTML = '';
      const curItem = items[index];
      gridItem.appendChild(curItem.mediaElement);

      // --- New Title Block ---
      const titleDiv = document.createElement("div");
      // Use JSON value for titleClass; if missing/empty/null then set to "null"
      const itemTitleClass = curItem.titleClass && curItem.titleClass.trim() ? curItem.titleClass : "null";
      titleDiv.id = "titleClass";
      titleDiv.className = itemTitleClass;

      const textBoxDiv = document.createElement("div");
      textBoxDiv.className = "text-box";

      const h1 = document.createElement("h1");
      h1.id = "slideTitle";
      if (curItem.slideTitle && curItem.slideTitle.trim()) {
        h1.textContent = curItem.slideTitle;
      } else {
        h1.className = "null";
      }

      const p = document.createElement("p");
      p.id = "description";
      if (curItem.description && curItem.description.trim()) {
        p.textContent = curItem.description;
      } else {
        p.className = "null";
      }

      textBoxDiv.appendChild(h1);
      textBoxDiv.appendChild(p);
      titleDiv.appendChild(textBoxDiv);
      gridItem.appendChild(titleDiv);
      // --- End New Title Block ---

      // Handle QR and Alt elements
      const qrDiv = document.createElement("div");
      qrDiv.id = curItem.qrId;
      qrDiv.className = "qrcode";
      const qrImg = document.createElement("img");
      qrImg.src = `${config.image}/${curItem.qrFile}`;
      qrDiv.appendChild(qrImg);
      gridItem.appendChild(qrDiv);

      const altDiv = document.createElement("div");
      altDiv.id = curItem.altId;
      altDiv.className = "altcode";
      if (curItem.altBg) {
        altDiv.style.backgroundColor = curItem.altBg;
      }
      const altImg = document.createElement("img");
      altImg.src = `${config.image}/${curItem.altFile}`;
      altDiv.appendChild(altImg);
      gridItem.appendChild(altDiv);

      // If media is a video, play it
      if (curItem.mediaElement.tagName === 'VIDEO') {
        curItem.mediaElement.play();
      }

      let displayTime;
      if (curItem.duration >= 2.00) {
        displayTime = curItem.duration * 1000;
      } else {
        displayTime = curItem.duration * totalSlideDuration;
      }

      elapsedTime += displayTime;
      if (elapsedTime > totalSlideDuration) {
        displayTime -= (elapsedTime - totalSlideDuration);
      }

      if (displayTime > 0) {
        setTimeout(() => {
          if (elapsedTime < totalSlideDuration) {
            currentItemIndex = (currentItemIndex + 1) % items.length;
            showItem(currentItemIndex);
          }
        }, displayTime);
      }
    }

    if (items.length > 0) {
      showItem(currentItemIndex);
    }
  });
}

function fadeElement(el, from, to, duration) {
  el.style.opacity = 0;
  el.style.transition = `opacity ${duration}ms ease-in`;
  setTimeout(() => { el.style.opacity = 1; }, 10);
}

function resetTimer() {
  if (typeof window.secondsElapsed !== "undefined") {
      window.secondsElapsed = 0;
      const timerElement = document.getElementById("timer");
      if (timerElement) {
          timerElement.textContent = "00:00";
          console.log("Timer reset to 00:00");
      }
  } else {
      console.warn("Timer variable 'secondsElapsed' is undefined.");
  }
}

// --------------------------
// Countdown Functions (HH:MM:SS format)
// --------------------------
function startCountdown(duration) {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return null;
  let remaining = duration;
  countdownEl.innerHTML = formatTime(remaining);
  const interval = setInterval(() => {
    remaining -= 1000;
    if (remaining <= 0) {
      countdownEl.innerHTML = "00:00:00";
      clearInterval(interval);
    } else {
      countdownEl.innerHTML = formatTime(remaining);
    }
  }, 1000);
  return interval;
}

function formatTime(ms) {
  let totalSeconds = Math.ceil(ms / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;
  return String(hours).padStart(2, "0") + ":" +
         String(minutes).padStart(2, "0") + ":" +
         String(seconds).padStart(2, "0");
}

// --------------------------
// Updated launch time parser.
// --------------------------
function parseLaunchTime(launchString) {
  // If the launch string contains a comma, assume it includes a full date and time.
  if (launchString.includes(",")) {
    return new Date(launchString);
  } else {
    // Otherwise, assume it is time only (e.g. "2:44:00 PM") and schedule it daily.
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    let launchTime = new Date(dateString + " " + launchString);
    // If the time has already passed today, schedule for tomorrow.
    if (launchTime.getTime() < now.getTime()) {
      launchTime.setDate(launchTime.getDate() + 1);
    }
    return launchTime;
  }
}

async function displaySlide(slideData, config) {
  let headTemplateName = slideData.head || "default";
  if (!headTemplateName.endsWith(".html")) headTemplateName += ".html";
  const headPath = `${config.head}/${headTemplateName}`;
  const headHTML = await fetchText(headPath);
  
  // Build layout HTML dynamically based on the updated JSON variables.
  const timerEnabled = ["Yes", "yes", "y", "Y"].includes(slideData.timer);
  const layoutClass = slideData.layout; // Use the JSON "layout" value for the class.
  const timerStyle = slideData.timerStyle || "timer"; // Use JSON "timerStyle" for the timer's class.
  
  let layoutHTML = `<div id="layout" class="${layoutClass}">`;
  if (timerEnabled) {
    layoutHTML += `<link id="timerStyles" rel="stylesheet" href="css/timer.css">`;
  }
  layoutHTML += `<div id="slideshow_parent" class="grid-container"></div>`;
  if (timerEnabled) {
    layoutHTML += `<div id="timer" class="${timerStyle}">00:00</div>`;
  }
  layoutHTML += `</div>
</body>
</html>`;
  
  appendTemplates(headHTML, layoutHTML);
  createSlideContent(slideData, config);
  
  // Start countdown if element exists.
  const countdownEl = document.getElementById("countdown");
  let countdownInterval = null;
  if (countdownEl) {
    countdownInterval = startCountdown(slideData.duration);
  }
  
  const parent = document.getElementById("slideshow_parent");
  fadeElement(parent, 0, 1, slideData.fade);
  await new Promise(resolve => setTimeout(resolve, slideData.duration - slideData.fade));
  fadeElement(parent, 1, 0, slideData.fade);
  await new Promise(resolve => setTimeout(resolve, slideData.fade));
  
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownEl.innerHTML = "";
  }
}

async function startSlideShow() {
  try {
    const config = await loadConfig();
    const slideFiles = await loadSlideIndex(config.show_files);
    
    let currentSlide = localStorage.getItem("currentSlide");
    if (currentSlide === null) {
      currentSlide = 0;
    } else {
      currentSlide = parseInt(currentSlide, 10);
    }
    
    let slideFileName = slideFiles[currentSlide];
    let isLaunchWait = false;
    if (slideFileName.startsWith("_")) {
      console.log("Starting Launch Wait Slide.");
      isLaunchWait = true;
      slideFileName = slideFileName.substring(1);
    }
    console.log("Starting " + slideFileName + " <" + new Date().toLocaleString() + ">");
    
    const slidePath = `${config.slides}/${slideFileName}`;
    const mainSlideData = await fetchJSON(slidePath);
    
    if (isLaunchWait && mainSlideData.launch && mainSlideData["launch-wait"] && mainSlideData["launch-wait-slide"]) {
      const launchTime = parseLaunchTime(mainSlideData.launch);
      const now = Date.now();
      const timeRemaining = launchTime - now;
      const launchWaitWindow = mainSlideData["launch-wait"] * 60000;
      
      console.log("Launch time: " + launchTime + ", Now: " + new Date(now) +
                  ", Time remaining: " + timeRemaining + " ms, Launch wait window: " + launchWaitWindow + " ms.");
      
      if (timeRemaining > 0 && timeRemaining <= launchWaitWindow) {
        console.log("Within launch wait window. Launching wait slide for " + timeRemaining + "ms.");
        const launchWaitSlidePath = `${config.slides}/${mainSlideData["launch-wait-slide"]}`;
        const launchWaitSlideData = await fetchJSON(launchWaitSlidePath);
        launchWaitSlideData.duration = timeRemaining;
        await displaySlide(launchWaitSlideData, config);
      } else {
        if (timeRemaining > launchWaitWindow) {
          console.log("Skipping due to it not being time to display the slide.");
        } else if (timeRemaining <= 0) {
          console.log("Skipping due to the presentation time having passed.");
        }
        setTimeout(() => {
          currentSlide = (currentSlide + 1) % slideFiles.length;
          localStorage.setItem("currentSlide", currentSlide);
          location.reload();
        }, 1000);
        return;
      }
    }
    
    await displaySlide(mainSlideData, config);
    resetTimer();
    currentSlide = (currentSlide + 1) % slideFiles.length;
    localStorage.setItem("currentSlide", currentSlide);
    location.reload();
  } catch (err) {
    console.error("Slideshow error:", err);
  }
}

document.addEventListener("DOMContentLoaded", startSlideShow);