// Set up the UI
if (isVariableDefined(dropZone)) {
    dropZone.addEventListener('dragenter', allowDrag);
    dropZone.addEventListener('dragenter', handleDragEnter, false);
    dropZone.addEventListener('dragover', allowDrag);
    dropZone.addEventListener("dragover", handleDragOver, false);
    dropZone.addEventListener("drop", handleDrop, false);
    dropZone.addEventListener("dragleave", handleDragLeave, false);
    dropZone.addEventListener("dblclick", openFileSelector, false);
}
if (isVariableDefined(darkModeToggle)) {
    // localStorage.removeItem("UIMode");
    darkModeToggle.addEventListener("change", (e) => {
        setUIMode(!e.target.checked);
    });
}
setMainContentUI();
// setMainContentUI_onRatio();
// setTOC_onRatio(initial=true);
let emInPx = getSizePrecise('1em', contentContainer);



// Event listeners
window.addEventListener('resize', function(event) {
    // setMainContentUI_onRatio();

    let isIncreasing = (window.innerWidth < storePrevWindowWidth) ? false : true;
    storePrevWindowWidth = window.innerWidth;
    resizePagination(isIncreasing);
});

// window.addEventListener('dblclick', function(event) {
//     setTOC_onRatio();
// });

window.addEventListener('dragenter', function(event) {
    historyLineNumber = getHistory(filename);
    init = true;
    event.preventDefault();
    let res = showDropZone(focused=true);
    // if (res == 0) {
    //     // showDropZone success
    //     contentContainer.style.display = "none";
    // }
});

contentContainer.onscroll = function(event) {
    // event.preventDefault();
    if (!init) {
        GetScrollPositions();
        // console.log(currentLine)
    }
};

// if (supportScrollEnd) {
//     contentContainer.onscrollend = function(evt) {
//         evt.preventDefault();
//         if (!init) {
//             GetScrollPositions();
//             if (flowMode) {
//                 preloadContentFlow(currentPage);
//             }
//         }
//     }
// }

function showSearch() {
    function close(evt) {
        // setEscapeFunc(null);
        unfreezeContent();
        dlg.slideUp(400, () =>{
            dlg.remove();
        });
    }
    function search(down = true) {
        let s = dlg.find(".search-txt").focus().val();
        if (s) {
            const re = new RegExp(`(${s})`, "gi");
            if (down) {
                for (let i = 0; i < fileContentChunks.length; i++) {
                    let j = (dlg.searchStartLine + i) % fileContentChunks.length;
                    if (re.test(fileContentChunks[j])) {
                        gotoLine(j, false);
                        let e = document.getElementById("line" + j);
                        e.innerHTML = e.innerHTML.replaceAll(re, `<mark>$1</mark>`);
                        dlg.searchStartLine = j + 1;
                        break;
                    }
                }
            } else {
                for (let i = 0; i < fileContentChunks.length; i++) {
                    let j = (dlg.searchStartLine - 1 - i + fileContentChunks.length) % fileContentChunks.length;
                    if (re.test(fileContentChunks[j])) {
                        gotoLine(j, false);
                        let e = document.getElementById("line" + j);
                        e.innerHTML = e.innerHTML.replaceAll(re, `<mark>$1</mark>`);
                        dlg.searchStartLine = j;
                        break;
                    }
                }
            }
        }
    }
    let dlg = $("#searchDlg");
    if (dlg.length <= 0) {
        dlg = $(`<div id="searchDlg" class="dialog" tabindex="0">
        <div class="dlg-cap">全文搜索<div class="dlg-close">&times;</div></div>
        <div class="dlg-body">搜索词（支持正则）
        <input type="text" class="search-txt" style="width: 10rem;" />
        <button class="btn-search-next">向后搜索</button>
        <button class="btn-search-prev">向前搜索</button>
        </div>
        </div>`).hide().appendTo(contentLayer);
        dlg.find(".dlg-close").click(close);
        dlg.find(".btn-search-next").click(() => search());
        dlg.find(".btn-search-prev").click(() => search(false));
        freezeContent();
        dlg.keydown(evt => {
            if (evt.key == "Escape") {
                close();
            } else if (evt.key == "Enter") {
                evt.preventDefault();
                search();
            } else {
                dlg.find(".search-txt").focus();
            }
            evt.stopPropagation();
        });
    }
    dlg.slideDown();
    dlg.searchStartLine = getTopLineNumber();
    dlg.find(".search-txt").focus();
    setEscapeFunc(close);
}

function showGoLine() {
    function close(evt) {
        // setEscapeFunc(null);
        unfreezeContent();
        dlg.remove();
    }
    function go(evt) {
        let s = dlg.find(".go-line-txt").val();
        if (s) {
            if (/^\d+$/.test(s)) {
                gotoLine(safeLineNum(parseInt(s)), false);
            } else if (/^\d+(\.\d*)?%$/.test(s)) {
                gotoLine(safeLineNum(Math.trunc((fileContentChunks.length * parseFloat(s) / 100))), false);
            }
            close();
        }
    }
    let dlg = $("#goLineDlg");
    if (dlg.length <= 0) {
        dlg = $(`<div id="goLineDlg" class="dialog" tabindex="0">
        <div class="dlg-cap">快速跳转<div class="dlg-close">&times;</div></div>
        <div class="dlg-body">行号或百分数(%)：
        <input type="text" class="go-line-txt" style="width: 10rem;" />
        <button class="btn-go">走你</button>
        </div>
        </div>`).hide().appendTo(contentLayer);
        dlg.find(".dlg-close").click(close);
        dlg.find(".btn-go").click(go);
        freezeContent();
        dlg.keydown(evt => {
            if (evt.key == "Escape") {
                close();
            } else if (evt.key == "Enter") {
                evt.preventDefault();
                go();
            } else {
                dlg.find(".search-txt").focus();
            }
            evt.stopPropagation();
        });
    }
    dlg.slideDown();
    dlg.find(".go-line-txt").focus();
    setEscapeFunc(close);
}

let tocSelItem = -1;
let tocFocused = false;
let tocCurItem = -1;
let tocNumPerPage = 10; // PgDn,PgUp 跳转章数
function focusTocItem(tocItem, focused=true) {
    if (!tocItem) return;
    if (focused) {
        tocItem.focus();
        tocItem.style.setProperty("outline", "2px dotted var(--mainColor_focused)");
        tocItem.style.setProperty("outline-offset", "2px");
    } else {
        tocItem.blur();
        tocItem.style.removeProperty("outline");
        tocItem.style.removeProperty("outline-offset");
    }
}
function showTOC(vis) {
    if (!isElementVisible(contentLayer)) return;
    if (vis) {
        setCSS(".toc-panel", "z-index", "1");
        setCSS(".toc-panel", "border-right", "1px solid var(--borderColor)");
        setCSS(".toc-panel", "box-shadow", "var(--shadowH_args)");
        setCSS(".toc-panel", "-webkit-box-shadow", "var(--webkit-shadowH_args)");
        setCSS(".toc-panel", "-moz-box-shadow", "var(--moz-shadowH_args)");
        setCSS(".toc-panel", "--toc-full-vis", "visible");
        setCSS(".toc-panel", "--toc-full-opacity", "1");
    } else {
        delCSS(".toc-panel", "z-index");
        delCSS(".toc-panel", "border-right");
        delCSS(".toc-panel", "box-shadow");
        delCSS(".toc-panel", "-webkit-box-shadow");
        delCSS(".toc-panel", "-moz-box-shadow");
        setCSS(".toc-panel", "--toc-full-vis", "hidden");
        setCSS(".toc-panel", "--toc-full-opacity", "0");
    }
}
function onDocKeydown(event) {
    if (!isElementVisible(contentLayer)) return;
    if (event.key == "Escape") {
        callEscapeFunc();
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (contentFreezed) {
        return;
    }
    let handled = false;
    if (event.key == "F1") { // hotkey help
        showHotkeyHint();
        handled = true;
    }
    else if (event.key == "Shift") { // activate toc
        if (event.repeat) return;
        showTOC(true);
        const tocItems = tocContainer.getElementsByClassName("toc-text");
        tocSelItem = -1;
        if (tocItems) {
            for (let i = 0; i < tocItems.length; i++) {
                if (tocItems[i].classList.contains("toc-active")) {
                    tocSelItem = i;
                    tocFocused = true;
                    tocCurItem = i;
                    break;
                }
            }
            if (tocSelItem >= 0) {
                focusTocItem(tocItems[tocSelItem], tocFocused);
                // tocNumPerPage = Math.floor(tocContainer.clientHeight / tocItems[tocFocusedItem].offsetHeight);
                // console.log(tocNumPerPage)
            }
        }
        handled = true;
    }
    else if (event.shiftKey) { // toc
        const tocItems = tocContainer.getElementsByClassName("toc-text");
        if (!tocItems.length) return;
        handled = true;
        focusTocItem(tocItems[tocSelItem], false);
        switch (event.key) {
            case "Home":
                tocSelItem = 0;
                tocFocused = true;
                break;
            case "End":
                tocSelItem = tocItems.length - 1;
                tocFocused = true;
                break;
            case "PageUp":
                tocSelItem = Math.max(tocSelItem - tocNumPerPage, 0);
                tocFocused = true;
                break;
            case "PageDown":
                tocSelItem = Math.min(tocSelItem + tocNumPerPage, tocItems.length - 1);
                tocFocused = true;
                break;
            case "ArrowUp":
                tocSelItem = Math.max(tocSelItem - 1, 0);
                tocFocused = true;
                break;
            case "ArrowDown":
                tocSelItem = Math.min(tocSelItem + 1, tocItems.length - 1);
                tocFocused = true;
                break;
            case " ":
                tocFocused = !tocFocused;
                break;
            default:
                handled = false;
                break;
        }
        if (tocSelItem >= 0) {
            focusTocItem(tocItems[tocSelItem], tocFocused);
        }
    } else { // content
        let lh = (1.5 + 1) * 1.4 * emInPx; // line-height + margin
        let p = contentContainer.getElementsByTagName("p");
        if (p.length) {
            lh = parseInt((p[0].currentStyle || window.getComputedStyle(p[0])).lineHeight) || (1.5 * 1.4 * emInPx);
            lh += parseInt((p[0].currentStyle || window.getComputedStyle(p[0])).marginTop) || (1.4 * emInPx);
        }
        if (flowMode && (nearPageBottom() || nearPageTop())) {
            preloadContentFlow(currentPage);
        }
        handled = true;
        let behavior = event.repeat ? "instant" : "smooth";
        switch (event.key) {
            case "Home":
                flowMode ? gotoLine(0, false) : contentContainer.scrollTo({top: 0,  behavior: "instant"});
                break;
            case "End":
                flowMode ? gotoLine(fileContentChunks.length - 1, false) : contentContainer.scrollTo({top: contentContainer.scrollHeight, behavior: "instant"});
                break;
            case "PageUp":
                (!flowMode && atPageTop() && currentPage > 1) ? gotoPage(currentPage - 1, "bottom") : contentContainer.scrollBy({top: -contentContainer.clientHeight + lh, behavior: behavior});
                break;
            case "PageDown":
            case " ":
                (!flowMode && atPageBottom() && currentPage < totalPages) ? gotoPage(currentPage + 1, "top") : contentContainer.scrollBy({top: contentContainer.clientHeight - lh, behavior: behavior});
                break;
            case "ArrowUp":
                (!flowMode && atPageTop() && currentPage > 1) ? gotoPage(currentPage - 1, "bottom") : contentContainer.scrollBy({top: -lh * 3, behavior: behavior});
                break;
            case "ArrowDown":
                (!flowMode && atPageBottom() && currentPage < totalPages) ? gotoPage(currentPage + 1, "top") : contentContainer.scrollBy({top: lh * 3, behavior: behavior});
                break;
            case 'ArrowLeft':
                if (!flowMode && currentPage > 1) gotoPage(currentPage - 1);
                break;
            case 'ArrowRight':
                if (!flowMode && currentPage < totalPages) gotoPage(currentPage + 1);
                break;
            // case 'Escape':
            //     // console.log("Escape pressed:", no_ui);
            //     callEscapeFunc();
            //     break;
            case "f":
                showSearch();
                break;
            case "g":
                showGoLine();
                break;
            default:
                handled = false;
                break;
        }
    }
    if (handled) {
        event.preventDefault();
        event.stopPropagation();
    }
};

function onDocKeyup(event) {
    if (!isElementVisible(contentLayer)) return;
    if (contentFreezed) {
        return;
    }
    if (event.key == "Shift") {
        event.preventDefault();
        event.stopPropagation();
        showTOC(false);
        const tocItems = tocContainer.getElementsByClassName("toc-text");
        if (tocItems.length) {
            if (tocSelItem >= 0) {
                focusTocItem(tocItems[tocSelItem], false);
                if (tocFocused && (tocSelItem != tocCurItem)) {
                    tocItems[tocSelItem].click();
                }
                tocSelItem = -1;
                tocFocused = false;
                tocCurItem = -1;
            }
        }
    }
}

function onContentWheel(event) {
    if (!isElementVisible(contentContainer)) return;
    if (contentFreezed) {
        event.preventDefault();
        return;
    }
    if (flowMode && event.deltaY != 0 && (nearPageBottom() || nearPageTop())) {
        // console.log("preload on wheel")
        // updateCurPos();
        // let line = currentLine;
        preloadContentFlow(currentPage);
        // gotoLine(line, false);
        // event.preventDefault();
        // event.stopPropagation();
    } else if (!flowMode) {
        if (event.deltaY > 0 && atPageBottom()  && currentPage < totalPages) {
            gotoPage(currentPage + 1, "top");
        } else if (event.deltaY < 0 && atPageTop()  && currentPage > 1) {
            gotoPage(currentPage - 1, "bottom");
        }
    }
    return;
}

function onProgressBarChanged(evt) {
    let prog = parseFloat(progressBar.value);
    if (!isNaN(prog)) {
        evt.stopPropagation();
        if (flowMode) {
            gotoLine(safeLineNum(Math.trunc((fileContentChunks.length * prog / 100))), false);
        } else {
            contentContainer.scrollTo({top: (contentContainer.scrollHeight - contentContainer.clientHeight) * prog / 100, behavior: "instant"});
        }
    }
}

progressBar.onmouseup = onProgressBarChanged;

document.onkeyup = onDocKeyup;

document.onkeydown = onDocKeydown;

contentContainer.onwheel = onContentWheel;

function openFileSelector(event) {
    event.preventDefault();
    var fileSelector = document.createElement("input");
    fileSelector.setAttribute("type", "file");
    fileSelector.setAttribute("accept", ".txt");
    fileSelector.click();
    // get the selected filepath
    fileSelector.onchange = function() {
        handleSelectedFile(this.files);
    };
    fileSelector.remove();
}

function allowDrag(event) {
    if (true) {  // Test that the item being dragged is a valid one
        event.dataTransfer.dropEffect = 'copy';
        event.preventDefault();
    }
}

function handleDragEnter(event) {
    // console.log("Drag enter");
    dragCounter++;
    event.preventDefault();
    showDropZone(focused=true);
}

function handleDragOver(event) {
    // console.log("Drag over");
    event.preventDefault();
    showDropZone(focused=true);
}

function handleDragLeave(event) {
    // console.log("Drag leave");
    dragCounter--;
    event.preventDefault();
    if (dragCounter === 0) {
        if (contentContainer.innerHTML === "") {
            // no file loaded, show dropZone
            showDropZone();
        } else {
            // file loaded, revert back to normal
            showContent();
            gotoLine(historyLineNumber, false);
            init = false;
        }
    }
}

async function handleDrop(event) {
    event.preventDefault();
    resetVars();
    // setTOC_onRatio(initial=true);

    var fileList = event.dataTransfer.files;
    if (fileList.length > 1 && typeof STRe_Bookshelf != "undefined") {
        for (let f of fileList)
            await STRe_Bookshelf.saveBook(f, false);
        await STRe_Bookshelf.refreshBookList();
    } else {
        handleSelectedFile(fileList);
    }
}

// by cataerogong:
//    regBefore( <callback> ) // <callback>: function (file_blob) -> new_file_blob
//    regAfter( <callback> ) // <callback>: function () -> undefined
//
//    example:
//    function renameSomeFile(f) { // change some file's name
//        if (f.name=="A.txt") {
//            return new File([f], "B.txt", {type: f.type, lastModified: f.lastModified});
//        } else {
//            return f;
//        }
//    }
//    function unzipFile(f) { // support zip-file
//        if (f.name.endsWith(".zip")) {
//            newF = unzip(f)[0]; // unzip and return the first file
//            return newF;
//        } else {
//            return f;
//        }
//    }
//    async function saveFileToDB(f) { // save file to db
//        if (f.type == "text/plain")
//            await db.saveFile(f); // call async function, wait for finish.
//        return f;
//    }
//    async function loadProgress() { // load progress from webdav
//        let line = await webdav.getProgress(filename);
//        setHistory(filename, line);
//        getHistory(filename);
//    }
//    fileloadCallback.regBefore(renameSomeFile);
//    fileloadCallback.regBefore(unzipFile);
//    fileloadCallback.regBefore(saveFileToDB);
//    fileloadCallback.regAfter(loadProgress);
var fileloadCallback = {
    beforeList: [],

    afterList: [],

    regBefore(callback) {
        if ((typeof(callback) == "function") && !this.beforeList.includes(callback))
            this.beforeList.push(callback);
    },
    unregBefore(callback) {
        let i = this.beforeList.indexOf(callback);
        if (i >= 0) this.beforeList.splice(i, 1);
    },

    regAfter(callback) {
        if ((typeof(callback) == "function") && !this.afterList.includes(callback))
            this.afterList.push(callback);
    },
    unregAfter(callback) {
        let i = this.afterList.indexOf(callback);
        if (i >= 0) this.afterList.splice(i, 1);
    },

    async before(f) {
        let newF = f;
        try {
            for (func of this.beforeList) {
                newF = (await func(newF)) || newF;
            }
        } catch (e) {
            console.log("fileloadCallback.before() error:", e);
        }
        console.log("fileloadCallback.before() finished.") //, newF);
        return newF;
    },

    async after() {
        try {
            for (func of this.afterList) {
                await func();
            }
        } catch (e) {
            console.log("fileloadCallback.after() error:", e);
        }
        console.log("fileloadCallback.after() finished.");
    }
};

// Main functions
// by cataerogong:
//    call fileloadCallback before and after file-load.
//    async function fileloadCallback.before(file_blob) -> new_file_blob
//    async function fileloadCallback.after() -> undefined
async function handleSelectedFile(fileList) {
    if (fileList.length > 0)
        fileList = [await fileloadCallback.before(fileList[0])];
    if (fileList.length > 0 && fileList[0].type === "text/plain") {
        var fileReader = new FileReader();

        fileReader.onload = function (event) {
            event.preventDefault();
            // Detect encoding
            let tempBuffer = new Uint8Array(fileReader.result.slice(0, encodingLookupByteLength));
            while (tempBuffer.byteLength < encodingLookupByteLength) {
                // make copies of tempBuffer till it is more than 1000 bytes
                tempBuffer = new Uint8Array([...tempBuffer, ...tempBuffer]);
            }
            const text = String.fromCharCode.apply(null, tempBuffer);
            const detectedEncoding = jschardet.detect(text).encoding || "utf-8";
            console.log('Encoding:', detectedEncoding);

            filename = fileList[0].name;
            // Get file content
            processFileContent(detectedEncoding, event.target.result);

            // Show content
            init = false;
            if (flowMode) {
                preloadContentFlow(currentPage);
            } else {
                showPageContent(currentPage);
                generatePagination();
            }
            resizePagination(false);

            // Retrieve reading history if exists
            // removeAllHistory();    // for debugging
            currentLine = getHistory(filename);
            if ((currentPage === 1) && (currentLine === 0) && (window.scrollY === 0)) {
                // if the first line is a header, it will show up in TOC
                setTitleActive(currentLine);
            }
            GetScrollPositions(false);
        };

        fileReader.onloadstart = function (event) {
            event.preventDefault();
            showLoadingScreen();
        };

        fileReader.onprogress = function (event) {
            event.preventDefault();
            showLoadingScreen();
        };

        fileReader.onloadend = function (event) {
            event.preventDefault();
            showContent();
            fileloadCallback.after();
        };

        fileReader.readAsArrayBuffer(fileList[0]);
    } else {
        resetUI();
    }
}

function processFileContent(detectedEncoding, buffer) {
    const decoderOptions = { stream: true, fatal: true };
    const decoder = new TextDecoder(detectedEncoding);
    var contents = decoder.decode(buffer, decoderOptions);
    if (logMode) {
        fileContentChunks = contents.split("\n");
        fileContentChunks.unshift(`<h2>${filename}</h2>`);
        totalPages = Math.ceil((fileContentChunks.length - 1) / itemsPerPage) + 1; // 总页数加上单独的扉页
        setDocumentFlag("data-lang", "CN");
        bookAndAuthor = {
            bookName: filename,
            author: "",
            bookNameRE: safeREStr(filename),
            authorRE: "",
        };
    } else {
        fileContentChunks = contents.split("\n").filter(Boolean).filter(n => n.trim() !== '');
        // Detect language
        isEasternLan = getLanguage(fileContentChunks.slice(0, 50).join("\n"));
        console.log("isEasternLan: ", isEasternLan);

        // Change UI language based on detected language
        if (isEasternLan) {
            style.ui_LANG = "CN";
        } else {
            style.ui_LANG = "EN";
        }
        setDocumentFlag("data-lang", style.ui_LANG);
        // Set fonts based on detected language
        // style.fontFamily_title = eval(`style.fontFamily_title_${style.ui_LANG}`);
        // style.fontFamily_body = eval(`style.fontFamily_body_${style.ui_LANG}`);
        // style.fontFamily_title = style.ui_LANG === "CN" ? style.fontFamily_title_CN : style.fontFamily_title_EN;
        // style.fontFamily_body = style.ui_LANG === "CN" ? style.fontFamily_body_CN : style.fontFamily_body_EN;

        // Get book name and author
        bookAndAuthor = getBookNameAndAuthor(filename.replace(/(.txt)$/i, ''));
        console.log("BookName: ", bookAndAuthor.bookName);
        console.log("Author: ", bookAndAuthor.author);

        fileContentChunks.push("&nbsp;"); // 末行可能会被优化为空，不显示，导致进度达不到 100%，因此增加一行
        totalPages = Math.ceil(fileContentChunks.length / itemsPerPage);

        // Get all titles and process all footnotes
        allTitles.push([style.toc_title, 0]);
        allTitles.push([style.toc_text_begin, 1]);
        titlePageLineNumberOffset = 1; // (bookAndAuthor.author !== "") ? 3 : 2;
        for (var i in fileContentChunks) {
            if (fileContentChunks[i].trim() !== '') {
                // get all titles
                tempTitle = getTitle(fileContentChunks[i]);
                if (tempTitle !== "") {
                    allTitles.push([tempTitle, (parseInt(i) + titlePageLineNumberOffset)]);
                }

                // process all footnotes
                fileContentChunks[i] = makeFootNote(fileContentChunks[i], `images/note_${style.ui_LANG}.png`);
            }
        }
        allTitles.push([style.toc_text_end, fileContentChunks.length]);
        // console.log(allTitles);
        // tocContainer.innerHTML = processTOC_bak();
        processTOC();
        // setMainContentUI();
        // Add title page
        let sealRotation = (style.ui_LANG === "EN") ? randomFloatFromInterval(-50, 80).toFixed(0) : randomFloatFromInterval(-5, 5).toFixed(0);
        // // fileContentChunks.unshift(`<div id=line${(titlePageLineNumberOffset - 1)} class='prevent-select seal'><img id='seal_${style.ui_LANG}' src='images/seal_${style.ui_LANG}.png' style='left:calc(${randomFloatFromInterval(0, 1)} * (100% - ${eval(`style.seal_width_${style.ui_LANG}`)})); ${sealRotation}'/></div>`);
        // fileContentChunks.unshift(`<div id=line${(titlePageLineNumberOffset - 1)} class='prevent-select seal'><img id='seal_${style.ui_LANG}' src='images/seal_${style.ui_LANG}.png' style='left:calc(${randomFloatFromInterval(0, 1)} * (100% - ${style.ui_LANG === 'CN' ? style.seal_width_CN : style.seal_width_EN})); ${sealRotation}'/></div>`);
        // if (bookAndAuthor.author !== "") {
        //     fileContentChunks.unshift(`<h1 id=line1 style='margin-top:0; margin-bottom:${(parseFloat(style.h1_lineHeight)/2)}em'>${bookAndAuthor.author}</h1>`);
        //     fileContentChunks.unshift(`<h1 id=line0 style='margin-bottom:0'>${bookAndAuthor.bookName}</h1>`);
        // } else {
        //     fileContentChunks.unshift(`<h1 id=line0 style='margin-bottom:${(parseFloat(style.h1_lineHeight)/2)}em'>${bookAndAuthor.bookName}</h1>`);
        // }
        let titlePage = `<h1 id="line0">
            <div>${bookAndAuthor.bookName}</div>
            <div class="title-page-author">${bookAndAuthor.author}</div>
            <div class='prevent-select seal'><img id='seal' src='images/seal_${style.ui_LANG}.png' style='--pos-offset:${randomFloatFromInterval(0, 1).toFixed(3)};--rotation:${sealRotation}deg;'/></div>
            </h1>`;
        fileContentChunks.unshift(titlePage);
        totalPages += 1;  // 总页数加上单独的扉页
    }
    booknameText.innerText = bookAndAuthor.bookName;
    authorText.innerText = bookAndAuthor.author;
    // Update the title of webpage
    document.title = bookAndAuthor.bookName;
}

function showPageContent(page) {
    // const startIndex = (currentPage - 1) * itemsPerPage;
    // const endIndex = startIndex + itemsPerPage;
    const startIndex =  Math.max((page - 2) * itemsPerPage + 1, 0); // 从 (p-2)*N+1；首页首行会从 -N+1 开始，改为从 0 开始
    const endIndex = (page - 1) * itemsPerPage + 1; // 到 (p-1)*N+1
    contentContainer.innerHTML = "";
    let to_drop_cap = false;

    // process line by line - fast
    for (var j = startIndex; j < endIndex && j < fileContentChunks.length; j++) {
        // if (fileContentChunks[j].trim() !== '') {
            let processedResult = process(fileContentChunks[j], j, to_drop_cap);
            to_drop_cap = processedResult[1] === 'h' ? true : false;
            // contentContainer.innerHTML += processedResult[0];
            contentContainer.appendChild(processedResult[0]);
        // }
    }

    // process 20 line at a time - fast
    // const line_step = 20;
    // for (var j = startIndex; j < endIndex && j < fileContentChunks.length; j+=line_step) {
    //     const preElement = document.createElement("pre");
    //     preElement.style.whiteSpace = 'pre-wrap'; // Enable word wrapping
    //     preElement.innerHTML = process_batch(fileContentChunks.slice(j, j+line_step).join('\n'));
    //     contentContainer.appendChild(preElement);
    // }

    // process one page at a time - slow
    // const preElement = document.createElement("pre");
    // preElement.style.whiteSpace = 'pre-wrap'; // Enable word wrapping
    // preElement.innerHTML = process_batch(fileContentChunks.join('\n'));
    // contentContainer.appendChild(preElement);

    // set up footnote
    Footnotes.setup();
}

function generatePagination() {
    paginationContainer.innerHTML = "";
    const paginationList = document.createElement("div");
    paginationList.classList.add("pagination");

    const showPages = getPageList(totalPages, currentPage, parseInt(style.ui_numPaginationItems));
    // console.log(`showPages: ${showPages}; currentPage: ${currentPage}`);
    for (var i = 1; i <= showPages.length; i++) {
        // Add a prev page button
        if (showPages[i-1] === 1) {
            var paginationItem_prev = document.createElement("div");
            // paginationItem_prev.innerHTML = `<a href='#' onclick='gotoPage(${(currentPage-1)})' class='prevent-select page'>&laquo;</a>`;
            let tempItem = document.createElement("a");
            tempItem.href = "#";
            tempItem.addEventListener('click', function(event) {
                event.preventDefault();
                gotoPage((currentPage-1));
            });
            tempItem.classList.add("prevent-select");
            tempItem.classList.add("page");
            // tempItem.innerHTML = "&laquo;";
            tempItem.innerText = "«";
            paginationItem_prev.appendChild(tempItem);

            if (currentPage === 1) {
                paginationItem_prev.classList.add("disabledbutton");
            }
            paginationList.appendChild(paginationItem_prev);
        }

        // Add a page button
        if (showPages[i-1] === 0) {
            var paginationItem = document.createElement("div");
            // paginationItem.innerHTML = "<a href='#!'><input type='text' id='jumpInput' placeholder='···' size='1' oninput='this.size = (this.value.length <= 0 ? 1 : this.value.length)' onkeypress='jumpToPageInputField(event)'></a>";
            let tempItem = document.createElement("a");
            tempItem.href = "#!";
            let tempInput = document.createElement("input");
            tempInput.type = "text";
            tempInput.classList.add("jumpInput");
            tempInput.placeholder = "···";
            tempInput.size = 1;
            tempInput.addEventListener('input', function(event) {
                this.size = (this.value.length <= 0 ? 1 : this.value.length);
            });
            tempInput.addEventListener('keypress', jumpToPageInputField);
            tempItem.appendChild(tempInput);
            paginationItem.appendChild(tempItem);
            paginationList.appendChild(paginationItem);
        } else {
            var paginationItem = document.createElement("div");
            // paginationItem.innerHTML = `<a href='#' onclick='gotoPage(${showPages[i-1]})' class='prevent-select page'>${showPages[i-1]}</a>`;
            let tempItem = document.createElement("a");
            tempItem.href = "#";
            tempItem.classList.add("prevent-select");
            tempItem.classList.add("page");
            // tempItem.innerHTML = showPages[i-1];
            tempItem.innerText = showPages[i-1];
            tempItem.addEventListener('click', function(event) {
                event.preventDefault();
                gotoPage(parseInt(this.innerHTML));
            });
            paginationItem.appendChild(tempItem);

            if (showPages[i-1] === currentPage) {
                paginationItem.classList.add("active");
                paginationItem.children[0].classList.add("active");
            }
            paginationList.appendChild(paginationItem);
        }

        // Add a next page button
        if (showPages[i-1] === totalPages) {
            var paginationItem_next = document.createElement("div");
            // paginationItem_next.innerHTML = `<a href='#' onclick='gotoPage(${(currentPage+1)})' class='prevent-select page'>&raquo;</a>`;
            let tempItem = document.createElement("a");
            tempItem.href = "#";
            tempItem.addEventListener('click', function(event) {
                event.preventDefault();
                gotoPage((currentPage+1));
            });
            tempItem.classList.add("prevent-select");
            tempItem.classList.add("page");
            // tempItem.innerHTML = "&raquo;";
            tempItem.innerText = "»";
            paginationItem_next.appendChild(tempItem);

            if (currentPage === totalPages) {
                paginationItem_next.classList.add("disabledbutton");
            }
            paginationList.appendChild(paginationItem_next);
        }
    }

    paginationContainer.appendChild(paginationList);
}

function processTOC() {
    for (var i in allTitles) {
        let tempBullet = document.createElement("a");
        tempBullet.id = `a${allTitles[i][1]}_bull`;
        tempBullet.href = `#line${allTitles[i][1]}`;
        tempBullet.classList.add("prevent-select");
        tempBullet.classList.add("toc-bullet");
        tempBullet.addEventListener('click', function(event) {
            event.preventDefault();
            // console.log("gotoLine: ", parseInt(event.target.id.replace(/(a|_bull)/g, '')));
            gotoLine(parseInt(event.target.id.replace(/(a|_bull)/g, '')));
        });
        tocContainer.appendChild(tempBullet);

        let tempText = document.createElement("a");
        tempText.id = `a${allTitles[i][1]}`;
        tempText.href = `#line${allTitles[i][1]}`;
        tempText.classList.add("prevent-select");
        tempText.classList.add("toc-text");
        tempText.innerText = allTitles[i][0];
        // tempText.title =  allTitles[i][0];
        tempText.addEventListener('click', function(event) {
            event.preventDefault();
            // console.log("gotoLine: ", parseInt(event.target.id.replace(/(a)/g, '')));
            gotoLine(parseInt(event.target.id.replace(/(a)/g, '')));
        });
        tocContainer.appendChild(tempText);
    }
}



// Helper functions
function jumpToPageInputField(event) {
    if (event.key === 'Enter') {
        gotoPage(parseInt(event.currentTarget.value));
    }
}

function gotoPage(page, scrollto="top") {
    if (!isNaN(page)) {
        page = safePageNum(page);
    } else {
        console.log(`Not a valid page number: ${page}, so goto <currentPage:${currentPage}>.`);
        page = currentPage;
    }
    if (flowMode) {
        // console.log("preload in gotoPage")
        preloadContentFlow(page);
    } else {
        showPageContent(page);

        switch (scrollto) {
            case "top":
                contentContainer.scrollTo({top: 0, behavior: 'instant'});
                break;
            case "bottom":
                contentContainer.scrollTo({top: contentContainer.scrollHeight, behavior: 'instant'});
                break;
        }
        updateCurPos();
        setHistory(filename, currentLine);
        generatePagination();
    }
    GetScrollPositions(!!scrollto);
}

function gotoLine(lineNumber, isTitle=true) {
    if (isTitle) {
        gotoTitle_Clicked = true;
    }
    // Find the page number to jump to
    // console.log(`lineNumber: ${lineNumber}, isTitle: ${isTitle}`);
    // let needToGoPage = lineNumber % itemsPerPage === 0 ? (lineNumber / itemsPerPage + 1) : (Math.ceil(lineNumber / itemsPerPage));
    // let needToGoPage = Math.ceil(lineNumber / itemsPerPage) + 1;
    // needToGoPage = needToGoPage > totalPages ? totalPages : (needToGoPage < 1 ? 1 : needToGoPage);
    let needToGoPage = getPageNum(lineNumber);
    // console.log("needToGoPage: ", needToGoPage);
    if (needToGoPage !== currentPage) {
        gotoPage(needToGoPage, "");
    }

    // scroll to the particular line
    try {
        const line = document.getElementById(`line${lineNumber}`);
        // console.log(line.offsetTop)
        contentContainer.scrollTo({top: line.offsetTop, behavior: "instant"});
        // console.log("line.tagName: ", line.tagName);
        // if (line.tagName === "H1" || line.tagName === "H2") {
        //     // // scroll back to show the title and margin
        //     // let style = line.currentStyle /* for IE */ || window.getComputedStyle(line);
        //     // let top_margin = parseFloat(style.marginTop);
        //     // contentContainer.scrollBy(0, -top_margin+1);

        //     // Set the title in the TOC as active
        //     setTitleActive(lineNumber);
        // }
    } catch (error) {
        console.log(`Error: No tag with id 'line${lineNumber}' found.`);
        gotoTitle_Clicked = false;
        return -1;
    }
    if (isTitle) {
        // Set the current title in the TOC as active
        setTitleActive(lineNumber);

        // gotoTitle_Clicked = true;
        // console.log("gotoTitle_Clicked: ", gotoTitle_Clicked);
    }

    // Remember the line number in history
    // setHistory(filename, lineNumber);
    updateCurPos();
    setHistory(filename, currentLine);
    gotoTitle_Clicked = false;
    return 0;
}

function updateCurPos() {
    currentLine = getCurLineNumber();
    currentPage = getPageNum(currentLine);
}

function GetScrollPositions(toSetHistory=true) {
    // console.log("GetScrollPositions() called, gotoTitle_Clicked: ", gotoTitle_Clicked);
    // console.log(GetScrollPositions.caller)

    // Get current scroll position
    // const scrollTop = window.scrollY || document.documentElement.scrollTop;
    // console.log(`Top: ${scrollTop}px`);

    // Get the line number on top of the viewport
    // currentLine = getTopLineNumber();
    // console.log("Current line: ", currentLine);
    updateCurPos();

    if (!gotoTitle_Clicked) {
        // Remember the line number in history
        if (toSetHistory) {
            setHistory(filename, currentLine);
        }

        // Get the title the current line belongs to
        // let curTitleID = 0;
        // for (var i = 0; i < allTitles.length; i++) {
        //     if (i < allTitles.length - 1) {
        //         if (currentLine >= allTitles[i][1] && currentLine < allTitles[i+1][1]) {
        //             // console.log("Current title: ", allTitles[i][0]);
        //             curTitleID = allTitles[i][1];
        //             break;
        //         }
        //     } else {
        //         if (currentLine >= allTitles[i][1] && currentLine < fileContentChunks.length) {
        //             // console.log("Current title: ", allTitles[i][0]);
        //             curTitleID = allTitles[i][1];
        //             break;
        //         }
        //     }
        // }
        // console.log("Current title ID: ", curTitleID);
        // Set the current title in the TOC as active
        // setTitleActive(curTitleID);

        // let curTitle = allTitles.findLast((t) => t[1] <= currentLine);
        // if (curTitle) {
        //     setTitleActive(curTitle[1]);
        // }
        let curTitle = findTitle(currentLine);
        if (curTitle)
            setTitleActive(curTitle[1]);
    }

    // let readingProgressText = eval(`style.ui_readingProgress_${style.ui_LANG}`);
    // let readingProgressText = style.ui_LANG === "CN" ? style.ui_readingProgress_CN : style.ui_readingProgress_EN;
    // readingProgressText = style.ui_LANG === "CN" ? readingProgressText : readingProgressText.replace("：", ":");
    
    // progressContainer.innerHTML = `<span style='text-decoration:underline'>${bookAndAuthor.bookName}</span><br/>${readingProgressText} ${((curLineNumber + 1) / fileContentChunks.length * 100).toFixed(1)}%`;
    // let pastPageLines = (currentPage - 1) * itemsPerPage;
    // let curItemsPerPage = Math.min(itemsPerPage, (fileContentChunks.length - pastPageLines));
    // let curPagePercentage = (curLineNumber + 1 - pastPageLines) / (curItemsPerPage - getBottomLineNumber() + curLineNumber);
    // let scalePercentage = curItemsPerPage / fileContentChunks.length;
    // let pastPagePercentage = pastPageLines / fileContentChunks.length;
    // let totalPercentage = (curPagePercentage * scalePercentage + pastPagePercentage) * 100;
    let totalPercentage = currentLine / (fileContentChunks.length - 1) * 100;
    // if ((curLineNumber === 0) && (currentPage === 1) && (window.scrollY <= 5)) {
    //     totalPercentage = 0;
    // }
    // progressContainer.innerHTML = `<span style='text-decoration:underline'>${bookAndAuthor.bookName}</span><br/>${readingProgressText} ${totalPercentage.toFixed(1).replace(".0", "")}%`;
    progressContent.innerText = `${totalPercentage.toFixed(1).replace(".0", "")}%`;
    if (flowMode) {
        progressBar.value = totalPercentage.toFixed(1);
        // flowProgress.title = totalPercentage.toFixed(1).replace(".0", "") + "%";
        progressBarContainer.style.setProperty("--value", progressBar.value);
        progressBarContainer.style.setProperty("--text-value", `"${progressBar.value}"`);
    } else {
        progressBar.value = (contentContainer.scrollTop / (contentContainer.scrollHeight - contentContainer.clientHeight) * 100).toFixed(1);
        progressBarContainer.style.setProperty("--value", progressBar.value);
        progressBarContainer.style.setProperty("--text-value", `"${progressBar.value}"`);
    }

    // gotoTitle_Clicked = false;
}

function setTitleActive(titleID) {
    if (logMode) return;
    // Remove all active titles
    let allActiveTitles = tocContainer.getElementsByClassName("toc-active");
    while (allActiveTitles.length) {
        allActiveTitles[0].classList.remove("toc-active");
    }
    try {
        // Set the selected title in the TOC as active
        let selectedTitle = document.getElementById(`a${titleID}`);
        selectedTitle.classList.add("toc-active");
        for (i in selectedTitle.children) {
            if (selectedTitle.children[i].classList) {
                selectedTitle.children[i].classList.add("toc-active");
            }
        }
        let selectedTitleBull = document.getElementById(`a${titleID}_bull`);
        selectedTitleBull.classList.add("toc-active");
        for (i in selectedTitleBull.children) {
            if (selectedTitleBull.children[i].classList) {
                selectedTitleBull.children[i].classList.add("toc-active");
            }
        }
        // Move the selected title to the center of the TOC
        if (!isInContainerViewport(tocContainer, selectedTitle, tocContainer.clientHeight / 10)) {
            tocContainer.scrollTo({top: selectedTitle.offsetTop - tocContainer.clientHeight / 2, behavior: 'smooth'});
        }
        // // Set the selected title's :target:before css style
        // let selectedLine = document.getElementById(`line${titleID}`);
        // if (selectedLine && (selectedLine.tagName[0] === "H")) {
        //     // style.ui_anchorTargetBefore = eval(`style.h${selectedLine.tagName[1]}_margin`);
        //     switch (selectedLine.tagName[1]) {
        //         case '1':
        //             style.ui_anchorTargetBefore = style.h1_margin;
        //         break;
        //         case '2':
        //             style.ui_anchorTargetBefore = style.h2_margin;
        //         break;
        //         case '3':
        //             style.ui_anchorTargetBefore = style.h3_margin;
        //         break;
        //         case '4':
        //             style.ui_anchorTargetBefore = style.h4_margin;
        //         break;
        //         case '5':
        //             style.ui_anchorTargetBefore = style.h5_margin;
        //         break;
        //         case '6':
        //             style.ui_anchorTargetBefore = style.h6_margin;
        //         break;
        //         default:
        //             style.ui_anchorTargetBefore = style.h2_margin;
        //     }
        // }
    } catch (error) {
        console.log(`Error: No title with ID ${titleID} found.`);
    }
}

function getTopLineNumber() {
    let lineNum = 0;
    for (i in contentContainer.children) {
        if (isInViewport(contentContainer.children[i])) {
            lineNum = parseInt(contentContainer.children[i].id.replace('line', ''));
            break;
        }
    }
    return lineNum;
}

function getBottomLineNumber() {
    let lineNum = 0;
    for (i in contentContainer.children) {
        if (isInViewport(contentContainer.children[i])) {
            lineNum = parseInt(contentContainer.children[i].id.replace('line', ''));
        }
    }
    return lineNum;
}

// 当前行号：当文件末行可见时取末行，否则取可见首行
function getCurLineNumber() {
    let top = NaN;
    let bottom = NaN;
    let vis = false;
    for (i in contentContainer.children) {
        if (isInViewport(contentContainer.children[i])) {
            bottom = parseInt(contentContainer.children[i].id.replace('line', ''));
            if (!vis) top = bottom;
            vis = true;
        } else {
            if (vis) break;
        }
    }
    // console.log(top, bottom, getCurLineNumber.caller)
    return (bottom >= fileContentChunks.length - 1) ? bottom : top;
}

function freezeContent() {
    contentFreezed = true;
    // document.onkeydown = null;
    // $("body").css("overflow-y", "hidden");
}
function unfreezeContent() {
    contentFreezed = false;
    // document.onkeydown = onDocKeydown;
    // $("body").css("overflow-y", "auto");
}

function preloadContentFlow(page) {
    // console.log(`Load page content in flow-mode. target: ${page}, Current preload range: ${preloadPageBegin}~${preloadPageEnd}`);
    let loadRange = null;
    let unloadRange = null;
    let insertBefore = null;
    if (page < preloadPageBegin || page > preloadPageEnd) { // 不在 preload 范围内，重新加载
        // console.log("Not in preload range, reloading.");
        preloadPageBegin  = page - 1;
        preloadPageEnd = page + 1;
        loadRange = getPagesRange(preloadPageBegin, preloadPageEnd);
        insertBefore = null;
        contentContainer.innerHTML = "";
    }
    else if (page == preloadPageEnd && preloadPageEnd < totalPages) { // preload 末页，向后加载一页，向前卸载一页
        // console.log("In preload range, appending.");
        preloadPageEnd++;
        loadRange = getPagesRange(preloadPageEnd, preloadPageEnd);
        unloadRange = getPagesRange(preloadPageBegin, preloadPageBegin);
        preloadPageBegin++;
        insertBefore = null;
    } else if (page == preloadPageBegin && preloadPageBegin > 1) { // preload 首页，向前加载一页，向后卸载一页
        // console.log("In preload range, prepending.");
        preloadPageBegin--;
        loadRange = getPagesRange(preloadPageBegin, preloadPageBegin);
        unloadRange = getPagesRange(preloadPageEnd, preloadPageEnd);
        preloadPageEnd--;
        insertBefore = contentContainer.firstElementChild;
    } else {
        // console.log("In preload range, skip.");
        return;
    }
    // 记录当前位置
    let ln = NaN;
    let lnElm = null;
    let offset = 0;
    if (contentContainer.children.length > 0) {
        ln = getCurLineNumber();
        lnElm = document.getElementById("line" + ln);
        offset = lnElm.getBoundingClientRect().top;
    }
    // console.log("Loading range", loadRange);
    let to_drop_cap = false;
    // process line by line - fast
    for (var j = loadRange.begin; j <= loadRange.end; j++) {
        try {
            let processedResult = process(fileContentChunks[j], j, to_drop_cap);
            to_drop_cap = processedResult[1] === 'h' ? true : false;
            contentContainer.insertBefore(processedResult[0], insertBefore);
        } catch(e) {
            console.log("Process line", j, "Error! Text:", fileContentChunks[j], "Error:", e);
            break;
        }
    }
    // console.log("Unloading range", unloadRange);
    if (unloadRange) {
        for (let i = unloadRange.begin; i <= unloadRange.end; i++) {
            let elm = document.getElementById("line" + i);
            if (elm) elm.remove();
        }
    }
    // 恢复当前位置
    if (lnElm) {
        // console.log("restor pos", lnElm.offsetTop, "-", offset)
        contentContainer.scrollTo({top: lnElm.offsetTop - offset, behavior: "instant"});
    }
    // console.log(`preload: target:${page} range:${preloadPageBegin}-${preloadPageEnd}`, getLoadedLineRange());

    // set up footnote
    Footnotes.setup();
}

function beforeLoadLogFile(file) {
    calcLogMode(file.name);
    if (isLogFile(file.name) && (file.type != "text/plain")) {
        return new File([file], file.name, {type: "text/plain"});
    }
    return file;
}

function afterLoadLogFile() {
    applyLogMode();
}

fileloadCallback.regBefore(beforeLoadLogFile);
fileloadCallback.regAfter(afterLoadLogFile);
