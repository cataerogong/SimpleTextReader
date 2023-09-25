function setMainContentUI() {
    // console.log("setMainContentUI");
    
    // Dark mode
    darkModeToggle.checked = (!getUIMode());
    setUIMode(!darkModeToggle.checked);
    style.ui_Mode = (!darkModeToggle.checked ? "light" : "dark");
    // console.log(style.ui_Mode);
    // darkModeActualButton.style.setProperty("visibility", "visible");
    setTimeout(function() {
        style.darkMode_animation = style.darkMode_default_animation;
    }, 1000);

    // Drop zone
    if (isVariableDefined(dropZoneText)) {
        dropZoneText.innerText = style.ui_dropZoneText || "txt";
    }
}

function resizePagination(isIncreasing) {
    if (isVariableDefined(paginationContainer)) {
        if (!isIncreasing) {
            if (((paginationContainer.offsetWidth) > (contentContainer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) > 5)) {
            // if (((paginationContainer.offsetWidth) > (contentLayer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) > 5)) {
                style.ui_numPaginationItems = (parseInt(style.ui_numPaginationItems) - 2).toString();
                style.ui_numPaginationItems = (Math.max(parseInt(style.ui_numPaginationItems), 5)).toString();
                generatePagination();
            }
        } else {
            if (((paginationContainer.offsetWidth + 2*(paginationContainer.offsetWidth / (parseInt(style.ui_numPaginationItems) + 2))) < (contentContainer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) < 9)) {
            // if (((paginationContainer.offsetWidth + 2*(paginationContainer.offsetWidth / (parseInt(style.ui_numPaginationItems) + 2))) < (contentLayer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) < 9)) {
                style.ui_numPaginationItems = (parseInt(style.ui_numPaginationItems) + 2).toString();
                style.ui_numPaginationItems = (Math.min(parseInt(style.ui_numPaginationItems), 9)).toString();
                generatePagination();
            }
        }
    }
}

function showLayer(layer) {
    setDocumentFlag("data-layer", layer);
    // if (isVariableDefined(dropZone)) {
    //     dropZone.style.visibility = (layer == "dropZone") ? "visible" : "hidden";
    //     dropZone.style.zIndex = (layer == "dropZone") * 1;
    // }
    // if (isVariableDefined(loadingScreen)) {
    //     loadingScreen.style.visibility = (layer == "loading") ? "visible" : "hidden";
    //     loadingScreen.style.zIndex = (layer == "loading") * 1;
    // }
    // if (isVariableDefined(contentLayer)) {
    //     contentLayer.style.visibility = (layer == "content") ? "visible" : "hidden";
    //     contentLayer.style.zIndex = (layer == "content") * 1;
    // }
}

function showDropZone(focused=false) {
    if (isVariableDefined(dropZone) && isVariableDefined(dropZoneText) && isVariableDefined(dropZoneImg)) {
        let c = style.mainColor;
        let filter = style.mainColor_filter;
        if (focused) {
            c = style.mainColor_focused;
            filter = style.mainColor_focused_filter;
        }
        dropZone.style.borderColor = c;
        dropZoneText.style.color = c;
        dropZoneImg.style.setProperty("filter", filter);
        showHotkeyHint(false);
        showLayer("dropZone");
        return 0;
    } else {
        return 1;
    }
}

function showLoadingScreen() {
    showLayer("loading");
}

function showContent() {
    showLayer("content");
}

function resetUI() {
    resetVars();
    showDropZone();
}

function resetVars() {
    style.ui_LANG = "CN";
    setDocumentFlag("data-lang", "CN");

    init = true;
    filename = "";
    fileContentChunks = []; // Clear content chunks when a new file is dropped
    allTitles = []; // Clear titles when a new file is dropped
    currentPage = 1; // Reset current page to 1 when a new file is dropped
    currentLine = 0;
    totalPages = 0; // Reset total pages to 0 when a new file is dropped
    isEasternLan = true;
    gotoTitle_Clicked = false;
    bookAndAuthor = {};
    footnotes = [];
    footnote_proccessed_counter = 0;
    dragCounter = 0;
    historyLineNumber = 0;
    storePrevWindowWidth = window.innerWidth;
    titlePageLineNumberOffset = 0;

    preloadPageBegin = 0;
    preloadPageEnd = 0;

    // document.title = eval(`style.ui_title_${style.ui_LANG}`);
    document.title = style.ui_title;
    contentContainer.innerHTML = "";
    tocContainer.innerHTML = "";
    booknameText.innerHTML = "";
    progressContent.innerHTML = "";
    footNoteContainer.innerHTML = "";
}

function showLineNumber(enable = true) {
    contentLayer.setAttribute("data-show-line-num", enable);
}

function setFlowMode(enable = true) {
    if (flowMode == enable) return;
    flowMode = enable;
    if (flowMode) {
        contentLayer.setAttribute("data-page-mode", "flow");
    } else {
        contentLayer.setAttribute("data-page-mode", "page");
    }
    if (isElementVisible(contentLayer)) {
        updateCurPos();
        if (flowMode) {
            preloadContentFlow(currentPage);
        } else {
            preloadPageBegin = 0;
            preloadPageEnd = 0;
            showPageContent(currentPage);
        }
        gotoLine(currentLine, false);
        generatePagination();
    }
}

function applyLogMode() {
    if (logMode) {
        contentLayer.setAttribute("data-reader-mode", "log");
        setFlowMode(true);
        showLineNumber(true);
    } else {
        contentLayer.setAttribute("data-reader-mode", "book");
        setFlowMode(settingMgr.get("mode").get("page-mode").value == "flow");
        showLineNumber(settingMgr.get("mode").get("show-line-num").value);
    }
}

function calcLogMode(fname) {
    if (isLogFile(fname)) {
        logMode = (readerMode != "book");
    } else {
        logMode = (readerMode == "log");
    }
}

function setReaderMode(mode) {
    readerMode = mode;
    if (filename) calcLogMode(filename);
    applyLogMode();
}

var escapeFunc = null;
function setEscapeFunc(callback) {
    escapeFunc = callback;
}
function callEscapeFunc() {
    escapeFunc ? escapeFunc() : resetUI();
}

/**
 * 
 * @param {Boolean | null} show true: show, false: hide, null: toggle
 */
function showHotkeyHint(show = null) {
    if (show === true) $("#hotkeyHint").show();
    else if (show === false) $("#hotkeyHint").hide();
    else $("#hotkeyHint").toggle();
}
