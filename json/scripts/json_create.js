let options = {};

// Updated helper function to reformat date/time while preserving the time portion
function formatDate(dateStr) {
  // If a comma exists, split on comma
  if (dateStr.includes(",")) {
    const parts = dateStr.split(",");
    const datePart = parts[0].trim();
    const timePart = parts[1].trim();
    const d = new Date(datePart);
    if (isNaN(d)) return dateStr.replace(",", " ");
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day} ${timePart}`;
  } else {
    // If there's a space, assume date and time are separated by space
    if (dateStr.indexOf(" ") !== -1) {
      const firstSpaceIndex = dateStr.indexOf(" ");
      const possibleDate = dateStr.substring(0, firstSpaceIndex).trim();
      const timePart = dateStr.substring(firstSpaceIndex).trim();
      const d = new Date(possibleDate);
      if (isNaN(d)) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day} ${timePart}`;
    } else {
      // No time portion, return as-is
      return dateStr;
    }
  }
}

function loadOptions() {
  fetch('options.json')
    .then(response => response.json())
    .then(data => {
      options = data;
      populateDropdowns();
      loadInitialLayoutInfo();
      updateElementsBasedOnLayout();
    })
    .catch(error => console.error('Error loading options:', error));
}

function populateDropdowns() {
  // Static fields from head through launch-wait-class
  const fields = [
    "head", "layoutType", "layout_Customization", "fade",
    "timer", "timerStyle", "beginRotation", "endRotation",
    "launch", "launch_wait", "launch_wait_slide", "launch-wait-class"
  ];
  fields.forEach(field => {
    const select = document.getElementById(field);
    const values = [...options[field]];
    // Ensure "custom" is the last option if present.
    const customIndex = values.indexOf("custom");
    if (customIndex > -1 && customIndex !== values.length - 1) {
      values.splice(customIndex, 1);
      values.push("custom");
    }
    values.forEach((option, index) => {
      const opt = document.createElement("option");
      let displayValue = option;
      if (option === null) displayValue = "null";
      opt.value = option === null ? "null" : option;
      opt.textContent = displayValue;
      select.appendChild(opt);
      if (field === "layoutType" && index === 0) {
        select.value = opt.value;
      }
    });
  });
}

function createDropdown(id, values) {
  let select = `<select id="${id}">`;
  const vals = [...values];
  const customIndex = vals.indexOf("custom");
  if (customIndex > -1 && customIndex !== vals.length - 1) {
    vals.splice(customIndex, 1);
    vals.push("custom");
  }
  vals.forEach(value => {
    let displayValue = value;
    if (value === null) displayValue = "null";
    select += `<option value="${value === null ? "null" : value}">${displayValue}</option>`;
  });
  select += `</select>`;
  return select;
}

function loadLayoutInfo() {
  const selectedLayout = document.getElementById("layoutType").value;
  if (selectedLayout) {
    const layoutFile = `layout_info/${selectedLayout.toLowerCase().replace(/\s+/g, '')}.html`;
    fetch(layoutFile)
      .then(response => response.text())
      .then(data => { document.getElementById("layout-info").innerHTML = data; })
      .catch(error => console.error('Error loading layout file:', error));
  }
}

function loadInitialLayoutInfo() {
  const layoutSelect = document.getElementById("layoutType");
  if (layoutSelect.options.length > 0) { loadLayoutInfo(); }
}

function createElement(elementIndex) {
  const container = document.createElement("div");
  container.id = `element_${elementIndex}`;
  const header = document.createElement("h3");
  header.textContent = `Element ${elementIndex}`;
  container.appendChild(header);
  const itemsDiv = document.createElement("div");
  itemsDiv.id = `items_${elementIndex}`;
  container.appendChild(itemsDiv);
  const addItemButton = document.createElement("button");
  addItemButton.textContent = "Add Item";
  addItemButton.type = "button";
  addItemButton.addEventListener("click", function () { addItem(elementIndex); });
  container.appendChild(addItemButton);
  return container;
}

function updateElementsBasedOnLayout() {
  const layoutSelect = document.getElementById("layoutType");
  const selectedLayout = layoutSelect.value;
  const layoutIndex = options.layoutType.indexOf(selectedLayout);
  if (layoutIndex !== -1 && options.childGridItems && options.childGridItems.length > layoutIndex) {
    const numElements = options.childGridItems[layoutIndex];
    const elementsContainer = document.getElementById("elements");
    elementsContainer.innerHTML = "";
    for (let i = 1; i <= numElements; i++) {
      const element = createElement(i);
      elementsContainer.appendChild(element);
    }
  }
}

function addItem(elementIndex) {
  const itemsDiv = document.getElementById(`items_${elementIndex}`);
  const itemIndex = itemsDiv.children.length + 1;
  const container = document.createElement("div");
  container.id = `item_${elementIndex}_${itemIndex}`;
  container.innerHTML = `
    <h4>Item ${itemIndex}</h4>
    <label>
      <span class="label-text">Content Type: </span>
      ${createDropdown(`contentType_${elementIndex}_${itemIndex}`, options.contentType)}
    </label><br>
    <label>
      <span class="label-text">Content: </span>
      <input type="text" id="content_${elementIndex}_${itemIndex}">
    </label><br>
    <label>
      <span class="label-text">Item Duration: </span>
      <input type="text" id="item_duration_${elementIndex}_${itemIndex}">
    </label><br>
<label>
  <span class="label-text">QR ID: </span>
  ${createDropdown(`qrId_${elementIndex}_${itemIndex}`, options.qrId)}
  <span id="qrIdInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
    <input type="text" id="qrId_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
  </span>
</label><br>
    <label>
      <span class="label-text">QR File: </span>
      ${createDropdown(`qrFile_${elementIndex}_${itemIndex}`, options.qrFile)}
      <span id="qrFileInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
        <input type="text" id="qrFile_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
      </span>
    </label><br>
    <label>
      <span class="label-text">Alt ID: </span>
      ${createDropdown(`altId_${elementIndex}_${itemIndex}`, options.altId)}
      <span id="altIdInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
        <input type="text" id="altId_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
      </span>
    </label><br>
    <label>
      <span class="label-text">Alt File: </span>
      ${createDropdown(`altFile_${elementIndex}_${itemIndex}`, options.altFile)}
      <span id="altFileInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
        <input type="text" id="altFile_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
      </span>
    </label><br>
<label>
  <span class="label-text">Alt BG: </span>
  ${createDropdown(`altBg_${elementIndex}_${itemIndex}`, options.altBg)}
  <span id="altBgInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
    <input type="text" id="altBg_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
  </span>
</label><br>
    <label>
      <span class="label-text">Title Class: </span>
      ${createDropdown(`titleClass_${elementIndex}_${itemIndex}`, options.titleClass)}
      <span id="titleClassInputContainer_${elementIndex}_${itemIndex}" style="display:none;">
        <input type="text" id="titleClass_${elementIndex}_${itemIndex}_custom" placeholder="enter custom text" class="custom_input">
      </span>
    </label><br>
    <label>
      <span class="label-text">Slide Title: </span>
      <input type="text" id="slideTitle_${elementIndex}_${itemIndex}">
    </label><br>
    <label>
      <span class="label-text">Description: </span>
      <input type="text" id="description_${elementIndex}_${itemIndex}">
    </label><br>
  `;
  itemsDiv.appendChild(container);

  // Attach event listeners for dynamic dropdowns (item-level)
  const qrFileSelect = document.getElementById(`qrFile_${elementIndex}_${itemIndex}`);
  if (qrFileSelect) {
    qrFileSelect.addEventListener("change", function () {
      const cont = document.getElementById(`qrFileInputContainer_${elementIndex}_${itemIndex}`);
      const input = document.getElementById(`qrFile_${elementIndex}_${itemIndex}_custom`);
      cont.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") input.value = "";
    });
  }
  const altIdSelect = document.getElementById(`altId_${elementIndex}_${itemIndex}`);
  if (altIdSelect) {
    altIdSelect.addEventListener("change", function () {
      const cont = document.getElementById(`altIdInputContainer_${elementIndex}_${itemIndex}`);
      const input = document.getElementById(`altId_${elementIndex}_${itemIndex}_custom`);
      cont.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") input.value = "";
    });
  }
  const altFileSelect = document.getElementById(`altFile_${elementIndex}_${itemIndex}`);
  if (altFileSelect) {
    altFileSelect.addEventListener("change", function () {
      const cont = document.getElementById(`altFileInputContainer_${elementIndex}_${itemIndex}`);
      const input = document.getElementById(`altFile_${elementIndex}_${itemIndex}_custom`);
      cont.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") input.value = "";
    });
  }
  const titleClassSelect = document.getElementById(`titleClass_${elementIndex}_${itemIndex}`);
  if (titleClassSelect) {
    titleClassSelect.addEventListener("change", function () {
      const cont = document.getElementById(`titleClassInputContainer_${elementIndex}_${itemIndex}`);
      const input = document.getElementById(`titleClass_${elementIndex}_${itemIndex}_custom`);
      cont.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") input.value = "";
    });
    const qrIdSelect = document.getElementById(`qrId_${elementIndex}_${itemIndex}`);
    if (qrIdSelect) {
      qrIdSelect.addEventListener("change", function () {
        const cont = document.getElementById(`qrIdInputContainer_${elementIndex}_${itemIndex}`);
        const input = document.getElementById(`qrId_${elementIndex}_${itemIndex}_custom`);
        cont.style.display = (this.value === "custom") ? "block" : "none";
        if (this.value !== "custom") input.value = "";
      });
    }
    const altBgSelect = document.getElementById(`altBg_${elementIndex}_${itemIndex}`);
    if (altBgSelect) {
      altBgSelect.addEventListener("change", function () {
        const cont = document.getElementById(`altBgInputContainer_${elementIndex}_${itemIndex}`);
        const input = document.getElementById(`altBg_${elementIndex}_${itemIndex}_custom`);
        cont.style.display = (this.value === "custom") ? "block" : "none";
        if (this.value !== "custom") input.value = "";
      });
    }
  }
}

function processDuration(value) {
  value = value.trim();
  return value.endsWith("000") ? Number(value) : Number(value) * 1000;
}

function processItemDuration(value, globalDuration) {
  value = value.trim();
  let num = Number(value);
  if (num < 2) return num * globalDuration;
  return value.endsWith("000") ? num : num * 1000;
}

function generateJSON() {
  const title = document.getElementById("title").value;

  // Process static fields with potential custom input
  function getStaticValue(selectId, inputId) {
    const val = document.getElementById(selectId).value;
    if (val === "custom") {
      return document.getElementById(inputId).value.trim();
    } else if (val === "null") {
      return null;
    } else {
      return val;
    }
  }

  let head = getStaticValue("head", "head_input");
  let layout_Customization = getStaticValue("layout_Customization", "layout_Customization_input");
  let fade = getStaticValue("fade", "fade_input");
  // If fade is numeric, convert it.
  if (fade !== null && !isNaN(fade)) { fade = Number(fade); }
  let timer = document.getElementById("timer").value;
  timer = timer === "null" ? null : timer;
  let timerStyle = getStaticValue("timerStyle", "timerStyle_input");

  let beginRotation = document.getElementById("beginRotation").value;
  if (beginRotation === "time" || beginRotation === "date/time") {
    const inputVal = document.getElementById("beginRotation_input").value.trim();
    beginRotation = inputVal !== "" ? inputVal : beginRotation;
  } else if (beginRotation === "null") {
    beginRotation = null;
  }

  let endRotation = document.getElementById("endRotation").value;
  if (endRotation === "time" || endRotation === "date/time") {
    const inputVal = document.getElementById("endRotation_input").value.trim();
    endRotation = inputVal !== "" ? inputVal : endRotation;
  } else if (endRotation === "null") {
    endRotation = null;
  }

  let launch = document.getElementById("launch").value;
  if (launch === "time" || launch === "date/time") {
    const inputVal = document.getElementById("launch_input").value.trim();
    launch = inputVal !== "" ? inputVal : launch;
  } else if (launch === "null") {
    launch = null;
  }

  // Convert date fields to the new format (YYYY‑MM‑DD with time preserved and comma removed)
  if (beginRotation !== null && beginRotation !== "time" && beginRotation !== "date/time") {
    beginRotation = formatDate(beginRotation);
  }
  if (endRotation !== null && endRotation !== "time" && endRotation !== "date/time") {
    endRotation = formatDate(endRotation);
  }
  if (launch !== null && launch !== "time" && launch !== "date/time") {
    launch = formatDate(launch);
  }

  let launch_wait = document.getElementById("launch_wait").value;
  launch_wait = launch_wait === "null" ? null : (!isNaN(launch_wait) ? Number(launch_wait) : launch_wait);

  let launch_wait_slide = getStaticValue("launch_wait_slide", "launch_wait_slide_input");
  let launchWaitClass = getStaticValue("launch-wait-class", "launch-wait-class_input");

  const selectedLayoutType = document.getElementById("layoutType").value;
  let contentChild = document.getElementById("contentChild").value;
  if (contentChild && !contentChild.endsWith("/")) { contentChild += "/"; }
  const durationInput = document.getElementById("duration").value;
  const duration = processDuration(durationInput);

  let correspondingLayout = "";
  const layoutIndex = options.layoutType.indexOf(selectedLayoutType);
  if (layoutIndex !== -1 && options.layout && options.layout.length > layoutIndex) {
    correspondingLayout = options.layout[layoutIndex];
  }

  const jsonData = {
    title: title,
    head: head,
    layoutType: selectedLayoutType,
    layout: correspondingLayout,
    layout_Customization: layout_Customization,
    contentChild: contentChild,
    duration: duration,
    fade: fade,
    timer: timer,
    timerStyle: timerStyle,
    beginRotation: beginRotation,
    endRotation: endRotation,
    launch: launch,
    launch_wait: launch_wait,
    launch_wait_slide: launch_wait_slide,
    "launch-wait-class": launchWaitClass
  };

  // Process dynamic item fields
  const elementsContainer = document.getElementById("elements");
  for (let i = 0; i < elementsContainer.children.length; i++) {
    let elementKey = "element_" + String(i + 1).padStart(3, '0');
    jsonData[elementKey] = {};
    const itemsDiv = elementsContainer.children[i].querySelector(`#items_${i + 1}`);
    if (itemsDiv) {
      for (let j = 0; j < itemsDiv.children.length; j++) {
        let itemKey = "item_" + String(j + 1).padStart(3, '0');
        const currentElementIndex = i + 1;
        const currentItemIndex = j + 1;
        const itemDurationInput = document.getElementById(`item_duration_${currentElementIndex}_${currentItemIndex}`).value;
        const item_duration = processItemDuration(itemDurationInput, duration);

        function getItemValue(selectId, customInputId) {
          const val = document.getElementById(selectId).value;
          if (val === "custom") {
            return document.getElementById(customInputId).value.trim();
          } else if (val === "null") {
            return null;
          } else {
            return val;
          }
        }

        let qrIdVal = getItemValue(`qrId_${currentElementIndex}_${currentItemIndex}`, `qrId_${currentElementIndex}_${currentItemIndex}_custom`);
        let qrFileVal = getItemValue(`qrFile_${currentElementIndex}_${currentItemIndex}`, `qrFile_${currentElementIndex}_${currentItemIndex}_custom`);
        let altIdVal = getItemValue(`altId_${currentElementIndex}_${currentItemIndex}`, `altId_${currentElementIndex}_${currentItemIndex}_custom`);
        let altFileVal = getItemValue(`altFile_${currentElementIndex}_${currentItemIndex}`, `altFile_${currentElementIndex}_${currentItemIndex}_custom`);
        let altBgVal = getItemValue(`altBg_${currentElementIndex}_${currentItemIndex}`, `altBg_${currentElementIndex}_${currentItemIndex}_custom`);
        let titleClassVal = getItemValue(`titleClass_${currentElementIndex}_${currentItemIndex}`, `titleClass_${currentElementIndex}_${currentItemIndex}_custom`);

        const itemData = {
          contentType: document.getElementById(`contentType_${currentElementIndex}_${currentItemIndex}`).value,
          content: document.getElementById(`content_${currentElementIndex}_${currentItemIndex}`).value,
          item_duration: item_duration,
          qrId: qrIdVal === "null" ? null : qrIdVal,
          qrFile: qrFileVal === "null" ? null : qrFileVal,
          altId: altIdVal === "null" ? null : altIdVal,
          altFile: altFileVal === "null" ? null : altFileVal,
          altBg: altBgVal === "null" ? null : altBgVal,
          titleClass: titleClassVal === "null" ? null : titleClassVal,
          slideTitle: document.getElementById(`slideTitle_${currentElementIndex}_${currentItemIndex}`).value,
          description: document.getElementById(`description_${currentElementIndex}_${currentItemIndex}`).value
        };
        jsonData[elementKey][itemKey] = itemData;
      }
    }
  }
  document.getElementById("output").textContent = JSON.stringify(jsonData, null, 4);
}

function copyToClipboard() {
  navigator.clipboard.writeText(document.getElementById("output").textContent);
  alert("Copied to clipboard!");
}

function downloadJSON() {
  const jsonData = document.getElementById("output").textContent;
  const blob = new Blob([jsonData], { type: "application/json" });
  let filename = prompt("Enter filename for download:", "slide1.json");
  if (!filename) {
    // If user cancels, do nothing.
    return;
  }
  // If the filename doesn't end with ".json" (case-insensitive), append it.
  if (!filename.toLowerCase().endsWith(".json")) {
    filename += ".json";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

window.onload = function () {
  loadOptions();

  // Static field event listeners for custom handling
  document.getElementById("head").addEventListener("change", function () {
    const container = document.getElementById("headInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("head_input").value = "";
  });

  document.getElementById("layout_Customization").addEventListener("change", function () {
    const container = document.getElementById("layout_CustomizationInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("layout_Customization_input").value = "";
  });

  document.getElementById("fade").addEventListener("change", function () {
    const container = document.getElementById("fadeInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("fade_input").value = "";
  });

  document.getElementById("timerStyle").addEventListener("change", function () {
    const container = document.getElementById("timerStyleInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("timerStyle_input").value = "";
  });

  document.getElementById("beginRotation").addEventListener("change", function () {
    const container = document.getElementById("beginRotationInputContainer");
    const input = document.getElementById("beginRotation_input");
    if (this.value === "time") {
      container.style.display = "block";
      input.placeholder = "12:00:00 PM";
      input.value = "";
    } else if (this.value === "date/time") {
      container.style.display = "block";
      input.placeholder = "2025-04-01 12:00:00 PM";
      input.value = "";
    } else {
      container.style.display = "none";
      input.value = "";
    }
  });

  document.getElementById("endRotation").addEventListener("change", function () {
    const container = document.getElementById("endRotationInputContainer");
    const input = document.getElementById("endRotation_input");
    if (this.value === "time") {
      container.style.display = "block";
      input.placeholder = "12:00:00 PM";
      input.value = "";
    } else if (this.value === "date/time") {
      container.style.display = "block";
      input.placeholder = "2025-04-01 12:00:00 PM";
      input.value = "";
    } else {
      container.style.display = "none";
      input.value = "";
    }
  });

  document.getElementById("launch").addEventListener("change", function () {
    const container = document.getElementById("launchInputContainer");
    const input = document.getElementById("launch_input");
    if (this.value === "time") {
      container.style.display = "block";
      input.placeholder = "12:00:00 PM";
      input.value = "";
    } else if (this.value === "date/time") {
      container.style.display = "block";
      input.placeholder = "2025-04-01 12:00:00 PM";
      input.value = "";
    } else {
      container.style.display = "none";
      input.value = "";
    }
  });

  document.getElementById("launch_wait_slide").addEventListener("change", function () {
    const container = document.getElementById("launchWaitSlideInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("launch_wait_slide_input").value = "";
  });

  document.getElementById("launch-wait-class").addEventListener("change", function () {
    const container = document.getElementById("launch-wait-classInputContainer");
    container.style.display = (this.value === "custom") ? "block" : "none";
    if (this.value !== "custom") document.getElementById("launch-wait-class_input").value = "";
  });

  document.getElementById("layoutType").addEventListener("change", function () {
    loadLayoutInfo();
    updateElementsBasedOnLayout();
  });

  document.getElementById("launch_wait").addEventListener("change", function () {
    // No custom input for launch_wait because it does not support "custom" option.
  });

  document.getElementById("generateJsonButton").addEventListener("click", function (event) {
    event.preventDefault();
    generateJSON();
  });

  fetch('instructions.html')
    .then(response => response.text())
    .then(html => { document.getElementById('instructions').innerHTML = html; })
    .catch(error => console.error('Error loading instructions:', error));
};
