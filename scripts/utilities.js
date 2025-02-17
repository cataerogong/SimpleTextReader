function setHistory(filename, lineNumber) {
    let fn = filename + ".progress";
    // console.log("History set to line: ", lineNumber);
    localStorage.setItem(fn, lineNumber + "/" + (fileContentChunks.length - 1));
    if (lineNumber === 0) {
        // Don't save history if line number is 0
        localStorage.removeItem(fn);
    }
}

function getHistory(filename, goto = true) {
    let fn = filename + ".progress";
    if (localStorage.getItem(fn)) {
        let m = localStorage.getItem(fn).match(/^(\d+)(\/(\d+))?$/i); // 格式：line/total，match() 的结果：[full, line, /total, total]
        let tempLine = (m ? parseInt(m[1]) : 0);
        if (goto) {
            console.log("History found! Go to line: ", tempLine);
            let success = gotoLine(tempLine, false);
            if (success === -1) {
                tempLine = 0;
            }
        }
        return tempLine;
    }
    return 0;
}

function removeAllHistory() {
    localStorage.clear();
}

// Credit: https://stackoverflow.com/questions/46382109/limit-the-number-of-visible-pages-in-pagination
// Returns an array of maxLength (or less) page numbers
// where a 0 in the returned array denotes a gap in the series.
// Parameters:
//   totalPages:     total number of pages
//   page:           current page
//   maxLength:      maximum size of returned array
function getPageList(totalPages, page, maxLength) {
    if (maxLength < 5) throw "maxLength must be at least 5";

    function range(start, end) {
        return Array.from(Array(end - start + 1), (_, i) => i + start); 
    }

    var sideWidth = maxLength < 9 ? 1 : 2;
    var leftWidth = (maxLength - sideWidth*2 - 3) >> 1;
    var rightWidth = (maxLength - sideWidth*2 - 2) >> 1;
    if (totalPages <= maxLength) {
        // no breaks in list
        return range(1, totalPages);
    }
    if (page <= maxLength - sideWidth - 1 - rightWidth) {
        // no break on left of page
        return range(1, maxLength - sideWidth - 1)
            .concat(0, range(totalPages - sideWidth + 1, totalPages));
    }
    if (page >= totalPages - sideWidth - 1 - rightWidth) {
        // no break on right of page
        return range(1, sideWidth)
            .concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
    }
    // Breaks on both sides
    return range(1, sideWidth)
        .concat(0, range(page - leftWidth, page + rightWidth),
                0, range(totalPages - sideWidth + 1, totalPages));
}

// Credit: https://www.javascripttutorial.net/dom/css/check-if-an-element-is-visible-in-the-viewport/
function isInViewport(el) {
    try {
        const rect = el.getBoundingClientRect();
        return (
            rect.bottom >= 0 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        );
    } catch (error) {
        return false;
    }
}

function isInContainerViewport(container, el, margin=0) {
    try {
        const containerRect = container.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= (containerRect.top + margin) &&
            rect.bottom <= (containerRect.bottom - margin)
        );
    } catch (error) {
        return false;
    }
}

// Credit: https://stackoverflow.com/questions/10463518/converting-em-to-px-in-javascript-and-getting-default-font-size
function getSize(size='1em', parent=document.body) {
    let l = document.createElement('div');
    l.style.visibility = 'hidden';
    l.style.boxSize = 'content-box';
    l.style.position = 'absolute';
    l.style.maxHeight = 'none';
    l.style.height = size;
    parent.appendChild(l);
    size = l.clientHeight;
    l.remove();
    return size;
}

function getSizePrecise(size='1em', parent=document.body) {
    if (isVariableDefined(parent)) {
        let l = document.createElement('div'), i = 1, s, t;
        l.style.visibility = 'hidden';
        l.style.boxSize = 'content-box';
        l.style.position = 'absolute';
        l.style.maxHeight = 'none';
        l.style.height = size;
        parent.appendChild(l);
        t = l.clientHeight;
        do {
            if (t > 1789569.6) {
                break;
            }
            s = t;
            i *= 10;
            l.style.height = `calc(${i}*${size})`;
            t = l.clientHeight;
        } while(t !== s * 10);
        l.remove();
        return t / i;
    } else {
        return -1;
    }
}

function randomFloatFromInterval(min, max) {
    return (Math.random() * (max - min) + min);
}

function isVariableDefined(v) {
    return (v !== "undefined" && v !== "" && v !== null && v !== undefined && v !== NaN);
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstElementChild;
}

/**
 * 在 `<html>` 上设置/删除标志，可用于 css 选择器 [attr=value] 根据标志改变 css
 * 同时刷新全局 style 变量
 * @param {string} name 标志名
 * @param {string} value 标志值，null 表示删除标志
 */
function setDocumentFlag(name, value) {
    if (value === null)
        document.documentElement.removeAttribute(name);
    else
        document.documentElement.setAttribute(name, value);
    // 刷新全局 style 变量
    style = new CSSGlobalVariables();
}

function setUIMode(mode) {
    console.log(`UI mode set to ${(mode ? "light" : "dark")}.`);
    localStorage.setItem("UIMode", mode);
    setDocumentFlag("data-theme", (mode ? "light" : "dark"));
}

function getUIMode() {
    if (isVariableDefined(localStorage.getItem("UIMode"))) {
        let mode = JSON.parse(localStorage.getItem("UIMode"));
        console.log(`UI mode is ${(mode ? "light" : "dark")}.`);
        return mode;
    } else {
        console.log("UI mode is light by default.");
        return true;
    }
}

function isElementVisible(elm, pseudoElt = null) {
    let style = elm.currentStyle /* for IE */ || window.getComputedStyle(elm, pseudoElt);
    return (style["display"] != "none") && (style["visibility"] != "hidden") && (style["visibility"] != "collapse");
}

function getCSS(sel, prop) {
    if (!sel) return null;
    for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
            if (rule.selectorText === sel) {
                if (prop)
                    return rule.style.getPropertyValue(prop);
                else
                    return rule.style;
            }
        }
    }
    return null;
}

function setCSS(sel, prop, val) {
    if (!sel || !prop || !val) return false;
    for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
            if (rule.selectorText === sel) {
                rule.style.setProperty(prop, val);
                return true;
            }
        }
    }
    document.styleSheets[document.styleSheets.length - 1].insertRule(`${sel} {${prop}: ${val}}`);
    return true;
}

function delCSS(sel, prop = "") {
    for (const sheet of document.styleSheets) {
        for (const i in sheet.cssRules) {
            let rule = sheet.cssRules[i];
            if (rule.selectorText === sel) {
                if (prop) {
                    rule.style.removeProperty(prop);
                    // console.log(`after delCSS(${sel},${prop})`, rule.style);
                } else {
                    sheet.deleteRule(i);
                    // console.log(`after delCSS(${sel})`, sheet.cssRules);
                }
                return true;
            }
        }
    }
    return false;
}

function atPageTop() {
    return (contentContainer.scrollTop == 0);
}

function atPageBottom() {
    return (contentContainer.scrollTop + contentContainer.clientHeight == contentContainer.scrollHeight);
}

function nearPageTop() {
    // console.log(contentContainer.scrollTop, contentContainer.clientHeight * 2);
    return (contentContainer.scrollTop <= contentContainer.clientHeight * 2);
}

function nearPageBottom() {
    // console.log(contentContainer.scrollTop, contentContainer.scrollHeight - contentContainer.clientHeight * 2)
    return (contentContainer.scrollTop >= contentContainer.scrollHeight - contentContainer.clientHeight * 2);
}

// 获取当前加载的行号范围
// return {begin: 起始行号 | NaN, end: 结束行号 | NaN}
function getLoadedLineRange() {
    let begin = NaN, end = NaN, total = NaN;
    if (contentContainer.firstElementChild)
        begin = parseInt(contentContainer.firstElementChild.id.replace("line", ""));
    if (contentContainer.lastElementChild)
        end = parseInt(contentContainer.lastElementChild.id.replace("line", ""));
    total = contentContainer.children.length;
    return {begin: begin, end: end, total: total};
}

function safeLineNum(line) {
    return Math.min(Math.max(line, 0), fileContentChunks.length - 1);
}

function safePageNum(page) {
    return Math.min(Math.max(page, 1), totalPages);
}

function getPagesRange(first, last) {
    if (isNaN(first) || isNaN(last) || (last < 1) || (first > totalPages) || (first > last))
        return null;
    return {
        begin: safeLineNum((first - 2) * itemsPerPage + 1), // 从 (first-2)*N+1
        end: safeLineNum(((last||first) - 1) * itemsPerPage) // 到 (last-1)*N
    };
}

function getPageNum(line = -1) {
    return Math.min(Math.ceil(((line >= 0) ? line : getCurLineNumber()) / itemsPerPage) + 1, totalPages);
}

function isLogFile(fname) {
    return LOG_FILENAME_RE.test(fname);
}

/**
 * 二分法查找行号所在章节
 * @param {int} ln Line number
 * @returns {[string, int]|undefined} [章节名, titleID]，未找到返回 undefined
 */
function findTitle(ln) {
    if (allTitles.length <= 0)
        return undefined;
    if (ln < allTitles[0][1])
        return undefined;
    if (ln >= allTitles[allTitles.length - 1][1])
        return allTitles[allTitles.length - 1];
    let begin = 0;
    let end = allTitles.length;
    let loop = 0;
    while (begin < end - 1 && loop < 20) {
        let mid = (begin + end) >> 1;
        if (allTitles[mid][1] <= ln) {
            begin = mid;
        } else {
            end = mid;
        }
        // console.log(begin, end)
        loop++;
    }
    // 正常20次循环可以查找的数组长度为 2^20，一般不会有这么大的标题数组吧
    if (loop >= 20) throw new Error("查找循环超过20次，算法可能有错！");
    return allTitles[begin];
}

function findTitle_test(...lnList) {
    if (lnList.length <= 0) {
        console.log("default test case");
        lnList = [-1, 0, 1, 2,
            allTitles[2][1] - 1, allTitles[2][1], allTitles[2][1] + 1,
            allTitles[allTitles.length - 2][1] - 1, allTitles[allTitles.length - 2][1], allTitles[allTitles.length - 2][1] + 1,
            allTitles[allTitles.length - 1][1] - 1, allTitles[allTitles.length - 1][1], allTitles[allTitles.length - 1][1] + 1,
            fileContentChunks.length >> 1, fileContentChunks.length >> 1 + 1,
            fileContentChunks.length - 1, fileContentChunks.length,];
    }
    for (const ln of lnList) {
        let t = findTitle(ln);
        let t2 = allTitles.findLast((e) => e[1] <= ln);
        console.log((t == t2) ? "-pass-" : "!FAIL!", "IN:", ln, "OUT:", t);
    }
}
