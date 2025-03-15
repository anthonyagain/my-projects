// has indices of 0 to 98 (representing levels 1 to 99).
const exp_to_next_level = [
  9,
  48,
  39,
  39,
  44,
  57,
  78,
  105,
  141,
  182,
  231,
  288,
  351,
  423,
  500,
  585,
  678,
  777,
  885,
  998,
  1119,
  1248,
  1383,
  1527,
  1676,
  1833,
  1998,
  2169,
  2349,
  2534,
  2727,
  2928,
  3135,
  3351,
  3572,
  3801,
  4038,
  4281,
  4533,
  4790,
  5055,
  5328,
  5607,
  5895,
  6188,
  6489,
  6798,
  7113,
  7437,
  7766,
  8103,
  8448,
  8799,
  9159,
  9524,
  9897,
  10278,
  10665,
  11061,
  11462,
  11871,
  12288,
  12711,
  13143,
  13580,
  14025,
  14478,
  14937,
  15405,
  15878,
  16359,
  16848,
  17343,
  17847,
  18356,
  18873,
  19398,
  19929,
  20469,
  21014,
  21567,
  22128,
  22695,
  23271,
  23852,
  24441,
  25038,
  25641,
  26253,
  26870,
  27495,
  28128,
  28767,
  29415,
  30068,
  30729,
  31398,
  32073,
  32757,
];

function calcCurrentTheoreticalLevel(pendingEXP) {
    let { pokemonLevel, pokemonEXP } = getTrainerData();

    // Add current EXP to the pending EXP
    pendingEXP += pokemonEXP;

    while (pendingEXP > 0 && pokemonLevel < 80) {
        const expNeededForNextLevel = exp_to_next_level[pokemonLevel - 1];

        if (pendingEXP >= expNeededForNextLevel) {
            // Deduct the EXP needed for next level from pendingEXP
            pendingEXP -= expNeededForNextLevel;

            // Level up the Pokemon
            pokemonLevel += 1;

            // If Pokemon reaches level 80, consider trainer leveling and reset Pokemon's level to 1
            if (pokemonLevel === 80) {
                pokemonLevel = 1;
            }
        } else {
            // Not enough EXP to level up anymore
            break;
        }
    }

    return pokemonLevel;
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const expGainSound = new Audio("static/firered_001B.wav");
const levelUpSound = new Audio("static/ruby_levelup.mp3");

function generateUniqueID() {
  return "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

// Function to set trainer data in localStorage
function setTrainerData(data) {
  if (data.hasOwnProperty("trainerLevel")) {
    localStorage.setItem("trainerLevel", data.trainerLevel.toString());
  }
  if (data.hasOwnProperty("pokemonLevel")) {
    localStorage.setItem("pokemonLevel", data.pokemonLevel.toString());
  }
  if (data.hasOwnProperty("pokemonEXP")) {
    localStorage.setItem("pokemonEXP", data.pokemonEXP.toString());
  }
}

//window.setTrainerData = setTrainerData;
// window.resetLevel = () => {
//   setTrainerData({'pokemonLevel': 10, 'pokemonEXP': 150});
//   refreshParty();
// }

// Function to retrieve trainer data from localStorage and parse it into a number
function getTrainerData() {
  let trainerLevel = localStorage.getItem("trainerLevel");
  if (trainerLevel === null) {
    localStorage.setItem("trainerLevel", "1");
    trainerLevel = "1";
  }

  let pokemonLevel = localStorage.getItem("pokemonLevel");
  if (pokemonLevel === null) {
    localStorage.setItem("pokemonLevel", "1");
    pokemonLevel = "1";
  }

  let pokemonEXP = localStorage.getItem("pokemonEXP");
  if (pokemonEXP === null) {
    localStorage.setItem("pokemonEXP", "0");
    pokemonEXP = "0";
  }

  return {
    trainerLevel: parseInt(trainerLevel, 10),
    pokemonLevel: parseInt(pokemonLevel, 10),
    pokemonEXP: parseInt(pokemonEXP, 10),
  };
}

function setWindowsCache(data) {
    localStorage.setItem("windowsCache", JSON.stringify(data));
}
function getWindowsCache() {
    return JSON.parse(localStorage.getItem("windowsCache") || 'null');
}

function playExpGainSound() {
  expGainSound.currentTime = 0; // Reset the sound to start
  expGainSound.volume = .4;
  expGainSound.play();
}

function stopExpGainSound() {
  expGainSound.pause();
  expGainSound.currentTime = 0; // Reset the sound to start
}

function playLevelUpSound() {
  levelUpSound.currentTime = 0; // Reset the sound to start
  expGainSound.volume = .4;
  levelUpSound.play();
}

async function animateExpBar(percentage) {
  const expBar = document.getElementById("js-exp-bar");

  if (percentage === 0) {
    expBar.style.width = `${percentage}%`;
  } else {
    playExpGainSound();

    const currentEXPWidth = $("#js-exp-bar").width();
    var parentWidth = $("#js-exp-bar").parent().width();
    var existingPercentFull = (currentEXPWidth / parentWidth) * 100;
    const distanceMove = percentage - existingPercentFull;

    // full bar animation = 5s, then convert to a percent
    const time = Math.min(distanceMove * 5 * 0.01, 1.8);

    const uniqueClassName =
      "exp-fill-animation-" + Math.random().toString(36).substr(2, 9);

    const animationStyle = `
        .${uniqueClassName} {
          transition: width ${time}s linear;
        }
      `;
    const styleElement = document.createElement("style");
    document.head.appendChild(styleElement);
    styleElement.textContent = animationStyle;

    expBar.classList.add(uniqueClassName);

    expBar.style.width = `${percentage}%`;

    await sleep(time * 1000 + 200);

    stopExpGainSound();
    expBar.classList.remove(uniqueClassName);
    document.head.removeChild(styleElement);
  }
}

async function handleGainEXP(expAmount) {
  let trainerData = getTrainerData();

  const expNeededForNextLevel = exp_to_next_level[trainerData.pokemonLevel - 1];

  // Calculate how much EXP is needed to reach the next level
  const expToNextLevel = expNeededForNextLevel - trainerData.pokemonEXP;

  if (expAmount < expToNextLevel) {
    trainerData.pokemonEXP += expAmount;
    const percentageFilled =
      (trainerData.pokemonEXP / expNeededForNextLevel) * 100;
    playExpGainSound();
    setTrainerData(trainerData);
    await animateExpBar(percentageFilled); // Full bar animation for level up
    expAmount = 0;
  } else {
    // Level up the Pokemon and update EXP
    expAmount -= expToNextLevel;
    trainerData.pokemonEXP = 0;
    trainerData.pokemonLevel += 1;

    if (trainerData.pokemonLevel === 80) {
      trainerData.pokemonLevel = 1;
      trainerData.trainerLevel += 1;
    }

    //playExpGainSound();
    await animateExpBar(100); // Full bar animation for level up
    setTrainerData(trainerData);

    $("#js-pokemon-level").text(trainerData.pokemonLevel);
    refreshPokemon(trainerData.pokemonLevel);
    playLevelUpSound();
    await sleep(800);
    // recurse to run next level
    await animateExpBar(0);
    await handleGainEXP(expAmount);
  }
}

const pokemon = ["mudkip.png", "marshtomp.png", "swampert.png"];

function refreshPokemon(pokemonLevel) {
  let current_pokemon;
  if (pokemonLevel >= 36) {
    current_pokemon = pokemon[2];
  } else if (pokemonLevel >= 16) {
    current_pokemon = pokemon[1];
  } else {
    current_pokemon = pokemon[0];
  }

  // set pokemon image
  $("#js-pokemon-image").remove();
  $("#js-pokemon-image-container").append(
    `<img id="js-pokemon-image" class="h-32" src="static/${current_pokemon}">`
  );
}

function refreshParty() {
  let current_pokemon;
  let current_exp_percent;

  const pokemon = ["mudkip.png", "marshtomp.png", "swampert.png"];

  const { trainerLevel, pokemonLevel, pokemonEXP } = getTrainerData();

  if (pokemonLevel >= 36) {
    current_pokemon = pokemon[2];
  } else if (pokemonLevel >= 16) {
    current_pokemon = pokemon[1];
  } else {
    current_pokemon = pokemon[0];
  }
  current_exp_percent =
    (pokemonEXP / exp_to_next_level[pokemonLevel - 1]) * 100;

  // set pokemon image
  $("#js-pokemon-image").remove();
  $("#js-pokemon-image-container").append(
    `<img id="js-pokemon-image" class="h-32" src="static/${current_pokemon}">`
  );

  // set trainer level and pokemon exp bar
  $("#js-trainer-level").text(trainerLevel);
  $("#js-exp-bar").css("width", `${current_exp_percent}%`);
  $("#js-pokemon-level").text(pokemonLevel);

  // after the pokemon image has loaded, set the position and text of the level element
  $("#js-pokemon-image").on("load", function () {
    const imageElement = $("#js-pokemon-image");

    const imageContainer = $("#js-pokemon-image-container");
    const levelElement = $("#js-pokemon-level");

    levelElement.text(pokemonLevel);

    const imageRect = imageElement[0].getBoundingClientRect();
    const containerRect = imageContainer[0].getBoundingClientRect();

    // Calculate the bottom and right offsets
    const bottomOffset = containerRect.bottom - imageRect.bottom;
    const rightOffset = containerRect.right - imageRect.right;

    // Apply the styles
    levelElement.css({
      bottom: `${bottomOffset}px`,
      right: `${rightOffset}px`,
    });
  });
}

/**
 * Calculate the elapsed time since a given start date and format it as HH:MM:SS.
 *
 * @param {Date} startDate - The date and time when the event started.
 * @return {string} The formatted elapsed time as HH:MM:SS.
 */
function elapsedTimeSince(startDate) {
  // Get the current date and time
  const now = new Date();

  // Calculate the elapsed time in milliseconds
  const elapsedTimeInMilliseconds = now - startDate;

  // Convert to seconds, then to hours, minutes, and seconds
  const elapsedTimeInSeconds = Math.floor(elapsedTimeInMilliseconds / 1000);
  const hours = Math.floor(elapsedTimeInSeconds / 3600);
  const remainingTimeInSeconds = elapsedTimeInSeconds % 3600;
  const minutes = Math.floor(remainingTimeInSeconds / 60);
  const seconds = remainingTimeInSeconds % 60;

  // Format the output as HH:MM:SS
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function initialize() {
  // initialize the callback for getting active window data
  window.electron.startRecordingWindows((event, value) => {
    updateExperienceAndRunningPrograms(value);
  });

  // trigger the above callback once per second
  let windowDataInterval = setInterval(() => {
    window.electron.getWindowData();
  }, 1000);

  // don't need to record mouse and keyboard stuff for now
  // window.electron.startRecordingMouse((event, value) => {
  //     console.log('mouse callback', { event, value });
  // });
  // window.electron.startRecordingKeyboard((event, value) => {
  //     console.log('keypress callback', { event, value });
  // });

  let pendingEXP = 0;
  //window.hax = () => {pendingEXP += 1000};
  let i = 0; // counter for the number of iterations of the exp gain loop

  refreshParty();

  function refreshEXPProgramList() {
    const expProgramsList =
      JSON.parse(localStorage.getItem("expProgramsList")) || [];
    const programsListHTML = expProgramsList
      .map((name) => {
        if (name.length > 14) {
          name = name.slice(0, 14) + "[...]";
        }
        return `
          <div class="js-program-delete-btn text-sm leading-tight hover:bg-gray-400 bg-gray-200 rounded m-0.5 px-0.5 cursor-pointer">${name}</div>
        `;
      })
      .join("\n");

    $("#js-exp-programs").empty();
    $("#js-exp-programs").append(
      `<div class="flex flex-wrap">${programsListHTML}</div>`
    );
  }

  refreshEXPProgramList();

  let animationRunning = false;

  /*
    We don't reuse this function in lieu of doing the individual DOM operations
    bc it can mess up a completion animation if this gets called on another element
    while the animation is playing.
    */
  function refreshTasksList() {
    // console.log({animationRunning})

    const tasksList = JSON.parse(localStorage.getItem("tasksList")) || [];
    const tasksListHTML = tasksList
      .map((task, i) => {
        const { id, text } = task;
        return `
          <li js-id=${id} class="js-task-element flex flex-row my-1">
            <div class="js-task-text w-60">${text}</div>
            <div class="flex flex-row items-center">
              <button class="js-complete-task w-5 h-5 border-2 border-gray-400 rounded text-green-500 text-sm mx-2"></button>
              <button class="js-delete-task w-5 h-5 bg-red-400 rounded text-white flex flex-row items-center justify-center mr-2">X</button>
            </div>
          </li>
        `;
      })
      .join("\n");

    $("#js-bonus-exp-tasks").empty();
    $("#js-bonus-exp-tasks").append(tasksListHTML);
  }

  refreshTasksList();

  // trigger JS code when running programs get clicked (to be added to exp section)
  $(document).on("click", ".js-program-btn", function (e) {
    // add new program to localStorage list
    let expProgramsList =
      JSON.parse(localStorage.getItem("expProgramsList")) || [];
    const clickedProgramName = $(event.target).text();

    if (!expProgramsList.includes(clickedProgramName)) {
      expProgramsList.push(clickedProgramName);
      localStorage.setItem("expProgramsList", JSON.stringify(expProgramsList));
    }
    // update UI
    refreshEXPProgramList();
    refreshRunningPrograms();
  });

  // trigger JS code when exp programs get clicked (to be removed from exp section)
  $(document).on("click", ".js-program-delete-btn", function (e) {
    // remove program from localStorage list
    let expProgramsList =
      JSON.parse(localStorage.getItem("expProgramsList")) || [];
    let clickedProgramName = $(event.target).text();

    // remove the ending thing if it is there, for comparison
    if(clickedProgramName.slice(-5) === '[...]') {
        clickedProgramName = clickedProgramName.slice(0, -5);
    }

    const index = expProgramsList.findIndex(i => i.startsWith(clickedProgramName));
    if (index !== -1) {
      expProgramsList.splice(index, 1);
      localStorage.setItem("expProgramsList", JSON.stringify(expProgramsList));
    }
    // update UI
    refreshEXPProgramList();
    refreshRunningPrograms();
  });

  function addNewTask() {
    let tasksList = JSON.parse(localStorage.getItem("tasksList")) || [];
    const newTaskText = $("#js-task-text").val();

    if (newTaskText === "") {
      return;
    }

    tasksList.push({ id: generateUniqueID(), text: newTaskText });
    localStorage.setItem("tasksList", JSON.stringify(tasksList));

    // update UI
    refreshTasksList();

    $("#js-task-text").val("");
  }

  // trigger JS code for adding new task
  $(document).on("click", "#js-add-task", function (e) {
    addNewTask();
  });

  // listen for enter key on adding new task
  $("#js-task-text").on("keydown", function (event) {
    if (event.which == 13) {
      event.preventDefault();
      addNewTask();
    }
  });

  // trigger JS code for completing task
  $(document).on("click", ".js-complete-task", function (e) {
    if (!trainingModeOn) {
      return;
    }

    const buttonElement = $(e.target);
    const rowElement = buttonElement.closest(".js-task-element");

    buttonElement.text("✓");
    buttonElement.removeClass("border-2 border-gray-400");
    buttonElement.addClass("bg-green-500 text-white");

    // Add fade-out animation
    animationRunning = true;
    rowElement.addClass("fade-out");

    const { pokemonLevel } = getTrainerData();
    const theoreticalLevel = calcCurrentTheoreticalLevel(pendingEXP);

    // TODO adjust as necessary
    pendingEXP += theoreticalLevel * 5;

    // Remove the element after animation completes
    setTimeout(() => {
      let tasksList = JSON.parse(localStorage.getItem("tasksList")) || [];
      const taskID = rowElement.attr("js-id");
      const taskIndex = tasksList.findIndex((t) => t.id === taskID);
      tasksList.splice(taskIndex, 1);
      localStorage.setItem("tasksList", JSON.stringify(tasksList));
      animationRunning = false;

      // update UI
      refreshTasksList();
    }, 1000);
  });

  // trigger JS code for deleting task
  $(document).on("click", ".js-delete-task", function (e) {
    const buttonElement = $(e.target);
    const rowElement = buttonElement.closest(".js-task-element");

    let tasksList = JSON.parse(localStorage.getItem("tasksList")) || [];
    const taskID = rowElement.attr("js-id");
    const taskIndex = tasksList.findIndex((t) => t.id === taskID);
    if(taskIndex === -1) {
      console.log("failed to find task with ID: ", taskID)
      return;
    }
    tasksList.splice(taskIndex, 1);

    localStorage.setItem("tasksList", JSON.stringify(tasksList));

    // update UI
    refreshTasksList();
  });

  // code for the activate training mode toggle
  let trainingModeOn = false;
  let trainingTimerInterval = null;
  let trainingStarted = null;
  $("#js-toggle-training-container").click(async function () {
    if (trainingModeOn) {
      trainingModeOn = !trainingModeOn;
      // Move to "Off" state
      $("#js-toggle-training-btn").css("left", "0");
      $("#js-toggle-training-container")
        .removeClass("bg-green-400")
        .addClass("bg-red-400");
      $("#js-training-text").text("Start Training:");
      trainingStarted = null;
      clearInterval(trainingTimerInterval);
      $("#js-training-timer").text("");

      pendingEXP = Math.floor(pendingEXP);

      if (pendingEXP !== 0) {
        $("#js-training-timer").text(`Gained ${pendingEXP} EXP!`);
        await handleGainEXP(pendingEXP); // add pending EXP to bar
        setTimeout(() => {
          if (!trainingModeOn) {
            $("#js-training-timer").text("");
          }
        }, 2000);
      }
      pendingEXP = 0;
    } else {
      trainingModeOn = !trainingModeOn;
      // Move to "On" state
      $("#js-toggle-training-btn").css("left", "50%");
      $("#js-toggle-training-container")
        .removeClass("bg-red-400")
        .addClass("bg-green-400");
      $("#js-training-text").text("Finish Training:");
      trainingStarted = new Date();
      trainingTimerInterval = setInterval(() => {
        $("#js-training-timer").text(
          `Training for: ${elapsedTimeSince(trainingStarted)}`
        );
      }, 1000);
      // set to zero immediately
      $("#js-training-timer").text(
        `Training for: ${elapsedTimeSince(trainingStarted)}`
      );
      i = 0;
    }
  });

  function refreshRunningPrograms(openWindows) {

    // if called without windows, use cache
    if(openWindows === undefined) {
        openWindows = getWindowsCache();
        // if no cache, no-op
        if(openWindows === null) {
            return;
        }
    } else {
        // else update cache
        setWindowsCache(openWindows);
    }

    const appNames = openWindows.map((w) => w.filename);
    const uniqueAppNames = Array.from(new Set(appNames));
    // match names ending in '[...]' correctly
    const expProgramsList =
      (JSON.parse(localStorage.getItem("expProgramsList")) || [])
      .map(expProgramName => {
          if(expProgramName.slice(-5) === '[...]') {
              expProgramName = expProgramName.slice(0, -5);
          }
          return expProgramName
      });

    const appNamesHTML = uniqueAppNames
      .filter((name) => !expProgramsList.some((expName) => name.startsWith(expName)))
      .map((name) => {
        if (name.length > 14) {
          name = name.slice(0, 14) + "[...]";
        }
        return `
                  <div class="js-program-btn text-sm leading-tight hover:bg-gray-400 bg-gray-200 rounded m-0.5 px-0.5 cursor-pointer">${name}</div>
                `;
      })
      .join("\n");

    $("#js-running-programs").empty();
    $("#js-running-programs").append(
      `<div class="flex flex-wrap">${appNamesHTML}</div>`
    );
  }

  function updateExperienceAndRunningPrograms(windowData) {
    i++;

    const { activeWindow, windows } = windowData;
    const theoreticalLevel = calcCurrentTheoreticalLevel(pendingEXP);

    // every 1 second, add EXP
    if (trainingModeOn) {
      const expProgramsList =
        JSON.parse(localStorage.getItem("expProgramsList")) || [];

      const { pokemonLevel } = getTrainerData();

      if (expProgramsList.includes(activeWindow.filename)) {
        // TODO adjust as necessary
        pendingEXP += 0.009 * theoreticalLevel;
      }
    }

    // every 10 seconds, update running programs list
    if (i % 10 === 1) {
      refreshRunningPrograms(windows);
    }
  }
}
initialize();
