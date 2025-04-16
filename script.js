document.addEventListener("DOMContentLoaded", function () {
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const alarmTimeDisplay = document.getElementById("alarm-time");
  const ampmToggleBtn = document.getElementById("ampm-toggle-btn");
  const addNoteButton = document.getElementById("add-note");
  const noteContainer = document.getElementById("note-container");
  const noteField = document.getElementById("note");
  const daysCheckboxes = document.querySelectorAll(".day-circle");
  const alarmList = document.getElementById("alarmsList");
  const toggvarheme = document.getElementById("theme-toggle");
  const toggleArea = document.getElementById("toggle-area");
  const bottomAlarmBtn = document.getElementById("submitButtonBottom");
  const actionButtons = document.querySelector(".action-buttons");
  const alarmPopup = document.getElementById('alarmPopup');
  const alarmSound = document.getElementById('alarmSound');
  const stopAlarmBtn = document.getElementById('stopAlarm');
  const snoozeAlarmBtn = document.getElementById('snoozeAlarm');


  var noteInputVisible = false;
  const center = { x: 100, y: 100 };
  var draggingHand = null;
  var selectedAMPM = "AM";

  // Toggle note input
  addNoteButton.addEventListener("click", () => {
    if (!noteInputVisible) {
      toggleArea.innerHTML = '<input type="text" id="note-input" placeholder="Add notes">';
      bottomAlarmBtn.style.display = "inline-block";
      actionButtons.classList.add("stacked");
      noteInputVisible = true;
      //noteContainer.style.display = "block";
      document.getElementById("note-input").focus();
    } else {
      toggleArea.innerHTML = '<button id="submitButton">Set Alarm</button>';
      bottomAlarmBtn.style.display = "none";
      actionButtons.classList.remove("stacked");
      noteInputVisible = false;
      //noteContainer.style.display = "none";
    }
  });

  // Draw clock numbers
  const numbersGroup = document.getElementById("numbers");
  for (var n = 1; n <= 12; n++) {
    const angle = (n * 30 - 90) * (Math.PI / 180);
    const x = 100 + Math.cos(angle) * 80;
    const y = 100 + Math.sin(angle) * 80 + 5;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "14");
    text.textContent = n;
    numbersGroup.appendChild(text);
  }

  function getMousePos(evt) {
    const svg = document.getElementById("clock");
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function getAngle(x, y) {
    const dx = x - center.x;
    const dy = y - center.y;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return (angle + 90 + 360) % 360;
  }

  function setHandRotation(hand, angle) {
    const length = hand === hourHand ? 40 : 60;
    const rad = (angle - 90) * (Math.PI / 180);
    const x = center.x + length * Math.cos(rad);
    const y = center.y + length * Math.sin(rad);
    hand.setAttribute("x2", x);
    hand.setAttribute("y2", y);
  }

  function getLineAngle(line) {
    const x2 = parseFloat(line.getAttribute("x2"));
    const y2 = parseFloat(line.getAttribute("y2"));
    return getAngle(x2, y2);
  }

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function getTimeFromHands() {
    const hourAngle = getLineAngle(hourHand);
    const minuteAngle = getLineAngle(minuteHand);
    var minutes = Math.round(minuteAngle / 6) % 60;
    var rawHour = Math.round(hourAngle / 30) % 12;
    const hour = rawHour === 0 ? 12 : rawHour;
    return `${pad(hour)}:${pad(minutes)} ${selectedAMPM}`;
  }

  function updateAlarmTime() {
    alarmTimeDisplay.textContent = getTimeFromHands();
  }

  document.getElementById("clock").addEventListener("mousedown", (e) => {
    const pt = getMousePos(e);
    const angle = getAngle(pt.x, pt.y);
    const minuteAngle = getLineAngle(minuteHand);
    const hourAngle = getLineAngle(hourHand);
    const angleDiffMin = Math.abs(minuteAngle - angle);
    const angleDiffHour = Math.abs(hourAngle - angle);
    draggingHand = angleDiffMin < angleDiffHour ? minuteHand : hourHand;
  });

  document.addEventListener("mousemove", (e) => {
    if (!draggingHand) return;
    const pt = getMousePos(e);
    const angle = getAngle(pt.x, pt.y);
    setHandRotation(draggingHand, angle);
    updateAlarmTime();
  });

  document.addEventListener("mouseup", () => {
    draggingHand = null;
  });

  // AM/PM toggle
  ampmToggleBtn.addEventListener("click", () => {
    selectedAMPM = selectedAMPM === "AM" ? "PM" : "AM";
    ampmToggleBtn.textContent = selectedAMPM;
    ampmToggleBtn.classList.remove("am-active", "pm-active");
    ampmToggleBtn.classList.add(selectedAMPM === "AM" ? "am-active" : "pm-active");
    updateAlarmTime();
  });

  // Initial clock position
  setHandRotation(hourHand, 0);
  setHandRotation(minuteHand, 0);
  updateAlarmTime();

  // Toggle day selection
  document.querySelectorAll(".day-circle").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });

  function handleAlarmSubmit() {
    const time = getTimeFromHands();
    const noteInput = document.getElementById("note-input");
    const note = noteInput ? noteInput.value : "";
    let selectedDays = Array.from(daysCheckboxes)
      .filter(day => day.classList.contains("active"))
      .map(day => day.textContent)
      .join(", ");

    if (!selectedDays) {
      selectedDays = "Everyday";
    }


    const alarmItem = document.createElement("div");
    alarmItem.className = "alarm-item";
    alarmItem.innerHTML = `
  <div class="alarm-time">${time}</div>
  <div class="alarm-days">${selectedDays || "-"}</div>
  <div class="alarm-note">${note || ""}</div>
  <div class="alarm-actions">
    <button class="edit-alarm">Edit</button>
    <button class="delete-alarm">Delete</button>
  </div>
`;


    alarmItem.querySelector(".delete-alarm").addEventListener("click", () => {
      alarmItem.remove();
    });

    alarmItem.querySelector(".edit-alarm").addEventListener("click", () => {
      // Example logic for editing:
      const alarmTime = alarmItem.querySelector(".alarm-time").textContent;
      const alarmNote = alarmItem.querySelector(".alarm-note").textContent;
      const alarmDays = alarmItem.querySelector(".alarm-days").textContent;

      // Fill the form with existing values
      if (document.getElementById("note-input")) {
        document.getElementById("note-input").value = alarmNote;
      }

      // Logic to set AM/PM based on existing time
      const parts = alarmTime.split(/[: ]/); // ["HH", "MM", "AM/PM"]
      const hour = parseInt(parts[0]);
      const minute = parseInt(parts[1]);
      const ampm = parts[2];

      // Set clock hands (roughly)
      setHandRotation(hourHand, hour % 12 * 30); // 12-hour to angle
      setHandRotation(minuteHand, minute * 6);
      selectedAMPM = ampm;
      ampmToggleBtn.textContent = selectedAMPM;
      ampmToggleBtn.classList.remove("am-active", "pm-active");
      ampmToggleBtn.classList.add(selectedAMPM === "AM" ? "am-active" : "pm-active");

      // Set days active
      document.querySelectorAll(".day-circle").forEach(dayBtn => {
        if (alarmDays.includes(dayBtn.textContent.trim())) {
          dayBtn.classList.add("active");
        } else {
          dayBtn.classList.remove("active");
        }
      });

      // Delete the current alarm (optional - to replace it)
      alarmItem.remove();
    });


    alarmList.appendChild(alarmItem);

    const timeParts = getTimeFromHands().split(/[: ]/);
    var hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const ampm = timeParts[2];

    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const alarm = {
      hour: hour,
      minute: minute,
      days: Array.from(daysCheckboxes)
        .filter(day => day.classList.contains("active"))
        .map(day => {
          const dayMap = {
            Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
          };
          return dayMap[day.textContent.trim()];
        }),
      rang: false
    };

    const existingAlarms = JSON.parse(localStorage.getItem('alarms') || '[]');
    existingAlarms.push(alarm);
    localStorage.setItem('alarms', JSON.stringify(existingAlarms));


    // 🔄 RESET EVERYTHING BELOW

    // Reset clock hands to 12:00
    setHandRotation(hourHand, 0);
    setHandRotation(minuteHand, 0);

    selectedAMPM = "AM";
    ampmToggleBtn.textContent = selectedAMPM;
    ampmToggleBtn.classList.remove("am-active", "pm-active");
    //ampmToggleBtn.classList.add("am-active");


    // Clear and hide note input
    if (noteInput) noteInput.value = "";
    toggleArea.innerHTML = `<button id="submitButton">Set Alarm</button>`;
    bottomAlarmBtn.style.display = "none";
    actionButtons.classList.remove("stacked");
    noteInputVisible = false;
    //noteContainer.style.display = "none";

    document.querySelectorAll(".day-circle").forEach(btn => {
      btn.classList.remove("active");
      // Optional cleanup:
      btn.removeAttribute("aria-pressed");
      btn.classList.remove("selected");
    });

    // Update displayed time
    updateAlarmTime();
  }

  // Assign handler to both submit buttons
  document.addEventListener("click", (e) => {
    if (e.target.id === "submitButton" || e.target.id === "submitButtonBottom") {
      handleAlarmSubmit();
    }
  });

  bottomAlarmBtn.addEventListener("click", handleAlarmSubmit);

  // Dark/light mode toggle
  toggvarheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const icon = toggvarheme.querySelector("i");
    icon.classList.toggle("fa-moon-o");
    icon.classList.toggle("fa-sun-o");
  });
});


let activeAlarm = null;
const alarmSound = new Audio('audio/alarm.mp3');

function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function triggerAlarm() {
  document.getElementById('alarmPopup').style.display = 'block';
  alarmSound.play();
  if (Notification.permission === 'granted') {
    new Notification("⏰ Alarm is ringing!");
  }
}

function startAlarm() {
  requestNotificationPermission();
  activeAlarm = true;
  setTimeout(() => {
    triggerAlarm();
  }, 5000); // 5 seconds test
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('stopAlarm').addEventListener('click', () => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    document.getElementById('alarmPopup').style.display = 'none';
  });

  document.getElementById('snoozeAlarm').addEventListener('click', () => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    document.getElementById('alarmPopup').style.display = 'none';

    setTimeout(() => {
      triggerAlarm();
    }, 5 * 60 * 1000);
  });
});