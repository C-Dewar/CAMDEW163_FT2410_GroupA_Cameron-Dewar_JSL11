// TASK: import helper functions from utils
// TASK: import initialData
import {
  getTasks,
  createNewTask,
  patchTask,
  putTask,
  deleteTask,
} from "./utils/taskFunctions.js";
import { initialData } from "./initialData.js";

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify(initialData));
    localStorage.setItem("showSideBar", "true");
  } else {
    console.log("Data already exists in localStorage");
  }
}

// TASK: Get elements from the DOM
const elements = {
  // Sidebar Elements:
  sideBarDiv: document.getElementById("side-bar-div"),
  boardsNavLinksDiv: document.getElementById("boards-nav-links-div"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  filterDiv: document.getElementById("filterDiv"),
  themeSwitch: document.getElementById("switch"),

  //Header Elements:
  headerBoardName: document.getElementById("header-board-name"),
  editBoardBtn: document.getElementById("edit-board-btn"),
  addNewTaskBtn: document.getElementById("add-new-task-btn"),

  //Task Column Elements: Query SelectorAll required to target all three classes of state.
  columnDivs: document.querySelectorAll(".column-div"),

  //Modal Elements:
  modalWindow: document.getElementById("new-task-modal-window"),
  editTaskModal: document.querySelector(".edit-task-modal-window"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"),
  saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),
  deleteTaskChangesBtn: document.getElementById("delete-task-btn"),
  createNewTaskBtn: document.getElementById("create-task-btn"),
};

let activeBoard = "";

// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map((task) => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
// TASK: Fix Bugs
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ""; // Clears the container
  boards.forEach((board) => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", function () {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
// TASK: Fix Bugs
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter((task) => task.board === boardName);

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  elements.columnDivs.forEach((column) => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks
      .filter((task) => task.status === status)
      .forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task-div");
        taskElement.textContent = task.title;
        taskElement.setAttribute("data-task-id", task.id);

        // Listen for a click event on each task and open a modal
        taskElement.addEventListener("click", function () {
          openEditTaskModal(task);
        });

        tasksContainer.appendChild(taskElement);
      });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll(".board-btn").forEach((btn) => {
    if (btn.textContent === boardName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector(".tasks-container");
  if (!tasksContainer) {
    console.warn(
      `Tasks container not found for status: ${task.status}, creating one.`
    );
    tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement("div");
  taskElement.className = "task-div";
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute("data-task-id", task.id);

  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  //Removing previous event listeners before attaching new ones
  elements.saveTaskChangesBtn.addEventListener("click", function (event) {
    saveTaskChangesHandler(event);
  });
  elements.deleteTaskChangesBtn.addEventListener("click", function (event) {
    deleteTaskHandler(event);
  });

  // Cancel editing task event listener
  elements.cancelEditBtn.addEventListener("click", function () {
    toggleModal(false, elements.editTaskModal);
  });

  // Cancel adding new task event listener
  elements.cancelAddTaskBtn.addEventListener("click", function () {
    toggleModal(false);
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener("click", function () {
    toggleModal(false, elements.editTaskModal); // Also hide the filter overlay
  });
  //Show sidebar event listener
  elements.showSideBarBtn.addEventListener("click", function () {
    toggleSidebar(true);
  });

  //Hide sidebar event listener
  elements.hideSideBarBtn.addEventListener("click", function () {
    toggleSidebar(false);
  });

  // Theme switch event listener
  elements.themeSwitch.addEventListener("change", toggleTheme);

  // Show Add New Task Modal event listener
  elements.addNewTaskBtn.addEventListener("click", function () {
    toggleModal(true);
    elements.filterDiv.style.display = "block"; // Also show the filter overlay
  });

  //Handle creating a new task when the create task btn is clicked after the add task button
  elements.createNewTaskBtn.addEventListener("click", function (event) {
    event.preventDefault();
    addTask(event);
  });
}

// Toggles tasks modal
// Task: Fix bugs
function toggleModal(show, modal = elements.modalWindow) {
  elements.filterDiv.style.display = show ? "block" : "none";
  modal.style.display = show ? "block" : "none";
}
/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function addTask(event) {
  const taskTitleInput = elements.modalWindow.querySelector("#title-input");
  const taskDescInput = elements.modalWindow.querySelector("#desc-input");
  const taskStatusInput = elements.modalWindow.querySelector("#select-status");

  if (!taskTitleInput || !taskDescInput || !taskStatusInput) {
    console.error("One or more form elements not found in the modal.");
    return;
  }

  const taskTitle = taskTitleInput.value;
  const taskDesc = taskDescInput.value;
  const taskStatus = taskStatusInput.value;

  //Assign user input to the task object
  const task = {
    title: taskTitle,
    description: taskDesc,
    status: taskStatus,
    board: activeBoard,
  };
  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
    elements.modalWindow.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  elements.sideBarDiv.style.display = show ? "block" : "none";
  elements.showSideBarBtn.style.display = show ? "none" : "block";
  elements.hideSideBarBtn.style.display = show ? "block" : "none";
}

function toggleTheme() {
  const isLightTheme = elements.themeSwitch.checked;
  document.body.classList.toggle("light-theme", isLightTheme);
  localStorage.setItem("light-theme", isLightTheme ? "enabled" : "disabled");
}

function openEditTaskModal(task) {
  // Set task details in modal inputs
  const titleInput = document.getElementById("edit-task-title-input");
  const descriptionInput = document.getElementById("edit-task-desc-input");
  const statusSelect = document.getElementById("edit-select-status");

  titleInput.value = task.title;
  descriptionInput.value = task.description;
  statusSelect.value = task.status;

  // Get button elements from the task modal

  elements.saveTaskChangesBtn.setAttribute("data-task-id", task.id);
  elements.deleteTaskChangesBtn.setAttribute("data-task-id", task.id);

  toggleModal(true, elements.editTaskModal);
}

function saveTaskChangesHandler(event) {
  // Get new user inputs
  const taskId = event.target.getAttribute("data-task-id");
  const titleInput = document.getElementById("edit-task-title-input");
  const descriptionInput = document.getElementById("edit-task-desc-input");
  const statusSelect = document.getElementById("edit-select-status");

  // Create an object with the updated task details
  const updatedTask = {
    title: titleInput.value,
    description: descriptionInput.value,
    status: statusSelect.value,
  };

  patchTask(parseInt(taskId), updatedTask);
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

// Delete task using a helper function and close the task modal
function deleteTaskHandler(event) {
  const taskId = event.target.getAttribute("data-task-id");
  deleteTask(parseInt(taskId));
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

/*************************************************************************************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  initializeData();

  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem("light-theme") === "enabled";
  document.body.classList.toggle("light-theme", isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}

/** Edits made to index.js file to address errors/user stories
 *
 *  - lines 3 & 4, correctly import functions from ./utils/taskFunctions.js & initialData from ./initialData.js
 *
 *  - Within the elements const variable, I had to find the relevant ID's and occasionally classes (in the case of the columns div & edit task modal)
 *    to correctly obtain the targets from the HTML DOM elements so that they could be dynamically manipulated by the JS
 *
 *  - No edits/debugging required on the fetchAndDisplayBoardsAndTasks function that I could identify.
 *
 *  - Line 74: Within the Display Boards function: needed to correct/fix the syntax of the boardElement event listener.
 *  - Line 80: Added the missing close bracket to complete the function syntax. Also added some semi-colons for personal legibility preferences within the function code block.
 *
 *  - Line 90: Fixed the equivalency check. "===" iso "=".
 *
 *  - Line 105: Fixed the equivalency check on task.status. "===" iso "=".
 *
 *  - Line 112: Corrected the eventListener function on the taskElement on click.
 *
 *  - Line 129: changed capitalisation on the forEach function
 *
 *  - Line 132: changed to correct syntax so the button targets the classlist for the add function
 *
 *  - Line 135: did the same for the remove button, i.e. corrected syntax/target.
 *
 *  - Line 147: Corrected the template literal syntax to backticks iso quoatation marks
 *
 *  - Line 161: added taskElement to be appended to the tasksContainer
 *
 *  - Line 169 - 171: Changed the cancel edit button to the correct syntax
 *
 *  - Line 208*: Corrected the syntax of the visibility change on the modal toggle function. Arrow changed to colon.
 *
 *
 *
 */
