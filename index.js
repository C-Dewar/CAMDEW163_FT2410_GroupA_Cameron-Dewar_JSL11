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
    if (elements.modalWindow.style.display === "block") {
      toggleModal(false); // Close the new task modal when clicking on the filterDiv when the windowModal is open during the addNewTaskBtn being clicked
    } else if (elements.editTaskModal.style.display === "block") {
      toggleModal(false, elements.editTaskModal); // Close the edit task modal
    }
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

function addTask() {
  const taskTitleInput = elements.modalWindow.querySelector("#title-input");
  const taskDescInput = elements.modalWindow.querySelector("#desc-input");
  const taskStatusInput = elements.modalWindow.querySelector("#select-status");

  if (!taskTitleInput || !taskDescInput || !taskStatusInput) {
    console.error("One or more form elements not found in the modal.");
    return;
  }

  const taskTitle = taskTitleInput.value.trim();
  const taskDesc = taskDescInput.value.trim();
  const taskStatus = taskStatusInput.value;
  if (!taskTitle || !taskDesc || !taskStatus) {
    alert("Please fill in all fields before adding a task.");
    return;
  }
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
 *  - Within the elements const elements variable, I had to find the relevant ID's and occasionally classes (in the case of the columns div & edit task modal)
 *    to correctly obtain the targets from the HTML DOM elements so that they could be dynamically manipulated by the JS
 *
 *  - Line 64: changed semi-colon to colon to correct syntax within fetchAndDisplayBoardsAndTasks function
 *
 *  - Line 76: Corrected syntax to target the board parameter by placing brackets around it
 *
 *  - Line 80: Corrected the syntax of the boardElement event listener
 *
 *  - Line 95: Corrected the syntax for both the equivalency check to "===" iso "=" and added brackets to target the task parameter
 *
 *  - Line 99: Corrected the syntax of the column div for each function
 *
 *  - Line 111 & 112: Corrected the syntax of the
 *
 *  - Line 119: Corrected the taskElement event listener and ensured that the overall function had the appropriate closure.
 *
 *  - Line 135: Corrected capitalisation/syntax forEach function and added brackets to correctly target the btn with the querySelector.
 *
 *  - Line 137 & 139: added ".classList" to ensure the correct syntax & ensure the correct/active classList was targeted.
 *
 *  - Line 146: Corrected the template literal syntax to backticks iso quoatation marks in the column query selector
 *
 *  - Line 168: Added taskElement to the appendChild function to ensure it is appropriately ammended to the taskContainer.
 *
 *  - Lines 173 - 216: Corrected eventListeners syntax and ensured that they called/corresponded to the appropriate functions and display elements respectively.
 *
 *  - Line 228: Fixed the toggle modal function and added a line to ensure the filterDiv was appropriately displayed relative to the toggleModal state.
 *
 *  - Lines 236 - 265: Coded logic for the addTask function and created const variables to target the correct elements  (titleInput/descriptionInput/statusInput)
 *                     I also made use of two if statements, the first to log an error to the console if either of those elements are not present and the second to
 *                     prevent the user from being able to create a blank entry by denying empty fields from being submitted. Alert will pop up if that is the case.
 *  - Lines 270 - 272: Coded logic for the toggle sideBar function to ensure the appropriate visibility of sideBarDiv/showSideBarBtn/hideSideBarBtn relative to its current state.
 *
 *  - Lines 276 - 278: Coded logic for toggle theme function which checks the state of the currently selected theme by using the appropriate element and saves it to local storage.
 *
 *  - Lines 283 - 296: Coded logic for openEditTaskModal function to grab the appropriate elements from the DOM, fills the modal inputs with that element information/task details
 *                     and then assigns the task id to the saveTaskChangesBtn & deleteTaskChangesBtn respectively so that they are called on the appropriate Id when clicked.
 *
 *  - Lines 301 - 315: Coded logic for the saveTaskChangesHandler function.
 *                     User inputs:
 *                     taskId -> retrieves the task id via the data-task-id attribute of the element that triggered the event. (i.e. save button, to which the unique task Id was assigned)
 *                     titleInput, descriptionInput & statusInput -> retrieves the appropriate HTML elements from the DOM of the task modal inputs that are being edited
 *                     const updatedTask -> Assigns the values of the edited fields to a new object
 *                     patchTask -> used to update specific fields of the edited task and I had to parseInt the resulting updated Task value, as that Id was a string, instead of an integer.
 *                     toggleModal called to close the modal upon saving.
 *  - Lines 319 - 323: Coded logic for a deleteTaskHandler which much like the saveTaskChangesHandler, uses the getAttribute function to target the unique Id of the currently accessed task to
 *                     call the deleteTask function on. I once more had to parseInt this unique Id as it was initially a string and wouldn't function correctly as is.
 *
 *
 *
 *
 *
 */
