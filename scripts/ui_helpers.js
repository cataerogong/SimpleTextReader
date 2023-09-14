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
        dropZoneText.innerText = (style.ui_LANG == "CN" ? style.ui_dropZoneText_CN : style.ui_dropZoneText_EN) || "txt";
    }
}

function updateTOCUI(isIncreasing) {
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
    if (isVariableDefined(dropZone)) {
        dropZone.style.visibility = (layer == "dropZone") ? "visible" : "hidden";
    }
    if (isVariableDefined(loadingScreen)) {
        loadingScreen.style.visibility = (layer == "loading") ? "visible" : "hidden";
    }
    if (isVariableDefined(contentLayer)) {
        contentLayer.style.visibility = (layer == "content") ? "visible" : "hidden";
    }
    if (isVariableDefined(tocPanel)) {
        tocPanel.style.display = (layer == "content") ? "" : "none";
    }
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
    init = true;
    filename = "";
    fileContentChunks = []; // Clear content chunks when a new file is dropped
    allTitles = []; // Clear titles when a new file is dropped
    currentPage = 1; // Reset current page to 1 when a new file is dropped
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

    // document.title = eval(`style.ui_title_${style.ui_LANG}`);
    document.title = style.ui_LANG == "CN" ? style.ui_title_CN : style.ui_title_EN;
    contentContainer.innerHTML = "";
    tocContainer.innerHTML = "";
    progressTitle.innerHTML = "";
    progressContent.innerHTML = "";
    footNoteContainer.innerHTML = "";
}