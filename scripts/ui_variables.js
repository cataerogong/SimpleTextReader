// Define variables
var style = new CSSGlobalVariables();
// console.log("in ui_variables style: ", style);
var init = true;
var filename = "";
var fileContentChunks = []; // Declare the variable outside the handleDrop function
var allTitles = [];
var encodingLookupByteLength = 1000;
var isEasternLan = true;
var itemsPerPage = 200;
var currentPage = 1;
var currentLine = 0;
var totalPages = 0;
var gotoTitle_Clicked = false;
var bookAndAuthor = {};
var footnotes = [];
var footnote_proccessed_counter = 0;
// Credit https://stackoverflow.com/questions/7110353/html5-dragleave-fired-when-hovering-a-child-element
var dragCounter = 0;
var historyLineNumber = 0;
var storePrevWindowWidth = window.innerWidth;
var titlePageLineNumberOffset = 0;

// var supportScrollEnd = ("onscrollend" in document.documentElement);

var flowMode = false;
var preloadPageBegin = 0;
var preloadPageEnd = 0;
var readerMode = "auto";
var logMode = false;
const LOG_FILENAME_RE = /\.log$|^(.*[^a-zA-Z])?log([^a-zA-Z].*)?.txt$/i;
var contentFreezed = false;

// document.title = eval(`style.ui_title_${style.ui_LANG}`);
if (!isVariableDefined(document.title)) {
    document.title = style.ui_title || "易笺";
}
var dropZone = document.getElementById('dropZone');
var loadingScreen = document.getElementById('loading');
// loadingScreen.style.visibility = "visible"; // For debugging the loading screen

var dropZoneText = document.getElementById("dropZoneText");
var dropZoneImg = document.getElementById("dropZoneImg");
var contentContainer = document.getElementById("content");
var tocPanel = document.getElementById("tocPanel");
var tocContainer = document.getElementById("tocContent");
var progressContainer = document.getElementById("progress");
var booknameText = document.getElementById("toc-bookname");
var authorText = document.getElementById("toc-author");
var progressContent = document.getElementById("progress-content");
var paginationContainer = document.getElementById("pagination");
var footNoteContainer = document.getElementById("footnote-content");

var menuPanel = document.getElementById("menuPanel");
var menuMain = document.getElementById("menuMain");
var menuTop = document.getElementById("menuTop");

var darkModeActualButton = document.getElementById("switch-btn");   // just for set visibility
var darkModeToggle = document.getElementById("switch");

var contentLayer = document.getElementById("contentLayer");
let progressBarContainer = document.getElementById("progressBarContainer");
let progressBar = document.getElementById("progressBar");

const _STRe_VER_ = "1.6.0-wip";
