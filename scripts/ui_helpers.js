function setMainContentUI() {
    dropZoneText.innerHTML = eval("style.ui_dropZoneText_" + style.ui_LANG);
    // windowWith = windowLeftRightMargin + tocWidth + gapWidth + contentWidth + windowLeftRightMargin;
    style.ui_contentMarginLeft = (100 - parseInt(style.ui_contentWidth) - parseInt(style.ui_windowLeftRightMargin)).toString();
    style.ui_tocWidth = (100 - parseInt(style.ui_contentWidth) - parseInt(style.ui_windowLeftRightMargin) * 2 - parseInt(style.ui_gapWidth)).toString();
    style.ui_paginationCenter = (parseInt(style.ui_contentWidth) / 2 + parseInt(style.ui_contentMarginLeft)).toString();
    contentContainer.style.width = style.ui_contentWidth + '%';
    contentContainer.style.marginTop = '0px';
    contentContainer.style.marginRight = '0px';
    contentContainer.style.marginBottom = '0px';
    contentContainer.style.marginLeft = style.ui_contentMarginLeft + '%';
    tocWrapper.style.width = style.ui_tocWidth + '%';
    tocWrapper.style.height = style.ui_tocHeight + '%';
    tocWrapper.style.marginTop = '0px';
    tocWrapper.style.marginRight = '0px';
    tocWrapper.style.marginBottom = '0px';
    tocWrapper.style.marginLeft = style.ui_windowLeftRightMargin + '%';
    tocContainer.style.width = style.ui_tocWidth + '%';
    tocContainer.style.height = 'auto';
    paginationContainer.style.left = style.ui_paginationCenter + '%';
    progressContainer.style.width = style.ui_tocWidth + '%';
    progressContainer.style.marginTop = '2.5em';
    progressContainer.style.marginRight = '0';
    progressContainer.style.marginBottom = '2.5em';
    progressContainer.style.marginLeft = style.ui_windowLeftRightMargin + '%';
    progressContainer.style.top = '75%';
}

function updateTOCUI(isIncreasing) {
    tocWrapper.style.height = style.ui_tocHeight + '%';
    tocContainer.style.height = 'auto';
    if (tocContainer.scrollHeight > (window.innerHeight * 0.5)) {
        tocContainer.style.height = '50%';
    }

    // console.log("width: ", paginationContainer.offsetWidth, "contentContainer.innerWidth * 0.6: ", (contentContainer.offsetWidth * 0.6), "contentContainer.innerWidth * 0.4: ", (contentContainer.offsetWidth * 0.4));
    if (!isIncreasing) {
        console.log(1);
        console.log(((paginationContainer.offsetWidth), (contentContainer.offsetWidth * 0.5)), (parseInt(style.ui_numPaginationItems)));
        if (((paginationContainer.offsetWidth) > (contentContainer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) > 5)) {
            console.log(2);
            style.ui_numPaginationItems = (parseInt(style.ui_numPaginationItems) - 2).toString();
            style.ui_numPaginationItems = (Math.max(parseInt(style.ui_numPaginationItems), 5)).toString();
            generatePagination();
        }
    } else {
        console.log(3);
        if (((paginationContainer.offsetWidth + 2*(paginationContainer.offsetWidth / (parseInt(style.ui_numPaginationItems) + 2))) < (contentContainer.offsetWidth * 0.5)) && (parseInt(style.ui_numPaginationItems) < 9)) {
            console.log(4);
            style.ui_numPaginationItems = (parseInt(style.ui_numPaginationItems) + 2).toString();
            style.ui_numPaginationItems = (Math.min(parseInt(style.ui_numPaginationItems), 9)).toString();
            generatePagination();
        }
    }
}

function setMainContentUI_onRatio() {
    if (window.innerWidth < window.innerHeight) {
        // Portrait mode
        tocContainer.style.display = "none";
        tocContainer.style.width = '36%';
        // tocContainer.style.height = '75%';
        tocContainer.style.backgroundColor = style.bgColor;
        tocContainer.style.marginLeft = '0%';
        tocContainer.style.paddingLeft = style.ui_windowLeftRightMargin + '%';
        tocContainer.style.border = '1px solid ' + style.borderColor;
        tocContainer.style.borderBottom = 'none';
        tocContainer.style.boxShadow = '0 0 1px ' + style.shadowColor + ', 0 0 2px ' + style.shadowColor + ', 0 0 4px ' + style.shadowColor + ', 0 0 8px ' + style.shadowColor + ', 0 0 16px ' + style.shadowColor;
        tocContainer.style.clipPath = 'inset(-16px -16px 0px -16px)';
        contentContainer.style.marginLeft = style.ui_windowLeftRightMargin + '%';
        contentContainer.style.width = (parseInt(style.ui_contentWidth) + parseInt(style.ui_contentMarginLeft) - parseInt(style.ui_windowLeftRightMargin)) + '%';
        progressContainer.style.display = "none";
        progressContainer.style.width = '36%';
        progressContainer.style.backgroundColor = style.bgColor;
        progressContainer.style.marginTop = '0';
        progressContainer.style.marginBottom = '0';
        progressContainer.style.marginLeft = '0';
        progressContainer.style.paddingTop = '3em';
        progressContainer.style.paddingBottom = '3em';
        progressContainer.style.paddingLeft = style.ui_windowLeftRightMargin + '%';
        progressContainer.style.border = '1px solid ' + style.borderColor;
        progressContainer.style.borderTop = 'none';
        progressContainer.style.boxShadow = '0 0 1px ' + style.shadowColor + ', 0 0 2px ' + style.shadowColor + ', 0 0 4px ' + style.shadowColor + ', 0 0 8px ' + style.shadowColor + ', 0 0 16px ' + style.shadowColor;
        progressContainer.style.clipPath = 'inset(1px -16px -16px -16px)';
        progressContainer.style.setProperty("top", "calc(75% - 1px)");
        paginationContainer.style.left = '50%';
    } else {
        // Landscape mode
        tocContainer.style.display = "block";
        tocContainer.style.width = style.ui_tocWidth + '%';
        // tocContainer.style.height = style.ui_tocHeight + '%';
        tocContainer.style.backgroundColor = 'transparent';
        tocContainer.style.border = 'none';
        tocContainer.style.boxShadow = 'none';
        tocContainer.style.clipPath = 'none';
        tocContainer.style.clipPath = 'none';
        contentContainer.style.marginLeft = style.ui_contentMarginLeft + '%';
        contentContainer.style.width = style.ui_contentWidth + '%';
        progressContainer.style.display = "block";
        progressContainer.style.width = style.ui_tocWidth + '%';
        progressContainer.style.backgroundColor = 'transparent';
        progressContainer.style.marginTop = '3em';
        progressContainer.style.marginRight = '0';
        progressContainer.style.marginBottom = '3em';
        progressContainer.style.paddingTop = '0';
        progressContainer.style.paddingBottom = '0';
        progressContainer.style.border = 'none';
        progressContainer.style.boxShadow = 'none';
        progressContainer.style.clipPath = 'none';
        progressContainer.style.top = '75%';
        paginationContainer.style.left = style.ui_paginationCenter + '%';
    }
}

function setTOC_onRatio(initial=false) {
    if (window.innerWidth < window.innerHeight) {
        // Portrait mode
        if (initial) {
            tocContainer.style.display = "none";
            progressContainer.style.display = "none";
        } else {
            if (tocContainer.style.display == "block") {
                tocContainer.style.display = "none";
                progressContainer.style.display = "none";
            } else {
                tocContainer.style.display = "block";
                progressContainer.style.display = "block";
            }
        }
    }
}

function showDropZone(focused=false) {
    let c = style.mainColor;
    let filter = style.mainColor_filter;
    if (focused) {
        c = style.mainColor_focused;
        filter = style.mainColor_focused_filter;
    }
    dropZone.style.visibility = "visible";
    dropZone.style.zIndex = "999";
    dropZone.style.borderColor = c;
    dropZoneText.style.visibility = "visible";
    dropZoneText.style.zIndex = "1000";
    dropZoneText.style.color = c;
    dropZoneImg.style.visibility = "visible";
    dropZoneImg.style.zIndex = "1001";
    dropZoneImg.style.setProperty("filter", filter);
}

function hideDropZone() {
    dropZone.style.visibility = "hidden";
    dropZone.style.zIndex = "1";
    dropZoneText.style.visibility = "hidden";
    dropZoneText.style.zIndex = "2";
    dropZoneImg.style.visibility = "hidden";
    dropZoneImg.style.zIndex = "3";
}

function showLoadingScreen() {
    loadingScreen.style.visibility = "visible";
}

function hideLoadingScreen() {
    loadingScreen.style.visibility = "hidden";
}

function showContent() {
    contentContainer.style.visibility = "visible";
    tocContainer.style.visibility = "visible";
    paginationContainer.style.visibility = "visible";
    progressContainer.style.visibility = "visible";
}

function hideContent() {
    contentContainer.style.visibility = "hidden";
    tocContainer.style.visibility = "hidden";
    paginationContainer.style.visibility = "hidden";
    progressContainer.style.visibility = "hidden";
}

function resetUI() {
    resetVars();
    showDropZone();
    hideLoadingScreen();
    hideContent();
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

    document.title = eval("style.ui_title_" + style.ui_LANG);
    contentContainer.innerHTML = "";
    tocContainer.innerHTML = "";
    progressContainer.innerHTML = "";
    footNoteContainer.innerHTML = "";
}