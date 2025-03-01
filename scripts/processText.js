// Title extraction
const regex_titles = new RegExp(rules_titles.join("|"), "i");

// Language detection
const regex_isEastern = new RegExp(rules_language);

// Punctuation detection
const regex_isPunctuation = new RegExp(rules_punctuation);

// ① - ㊿: FootNote detection
const regex_isFootNote = new RegExp(rules_footnote);

// Process text content as a batch
// OBSOLETE
function process_batch(str) {
    let to_drop_cap = false;
    let arr = str.split('\n');
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        current = arr[i].trim();
        if (current !== '') {
            if (regex_titles.test(current)) {
                newArr.push(`<h2>${current.replace(":", "").replace("：", "")}</h2>`);
                to_drop_cap = true;
            } else {
                if (to_drop_cap && !isEasternLan) {
                    isPunctuation = regex_isPunctuation.test(current[0]);
                    if (isPunctuation) {
                        index = 0
                        while (regex_isPunctuation.test(current[index])) {
                            index++;
                        }
                        newArr.push(`<p class="first"><span class="dropCap">${current.slice(0, index+1)}</span>${current.slice(index+1)}</p>`);
                    } else {
                        newArr.push(`<p class="first"><span class="dropCap">${current[0]}</span>${current.slice(1)}</p>`);
                    }
                    to_drop_cap = false;
                } else {
                    newArr.push(`<p>${current}</p>`);
                    to_drop_cap = false;
                }
            }
        }
    }
    return newArr.join('');
}

// Process text content line by line
function processBookMode(str, lineNumber, to_drop_cap) {
    if (lineNumber < titlePageLineNumberOffset) {
        current = str.trim();
        if (current.slice(1, 3) === "h1" || current.slice(1, 5) === "span") {
            let wrapper= document.createElement('div');
            wrapper.innerHTML = current;
            let tempElement = wrapper.firstElementChild;
            // tempElement.innerHTML = `<a href='#line${lineNumber}' onclick='gotoLine(${lineNumber})' class='prevent-select title'>${tempElement.innerHTML}</a>`;

            let tempAnchor = document.createElement('a');
            tempAnchor.href = `#line${lineNumber}`;
            tempAnchor.classList.add('prevent-select');
            tempAnchor.classList.add('title');
            tempAnchor.innerHTML = tempElement.innerHTML;
            tempAnchor.addEventListener('click', function(event) {
                // console.log("h1 Clicked");
                event.preventDefault();
                gotoLine(parseInt(this.parentElement.id.slice(4)));
            });
            tempElement.innerHTML = '';
            tempElement.appendChild(tempAnchor);

            current = tempElement.outerHTML;
            return [tempElement, 't'];
        } else {
            // do nothing
            let tempSpan = document.createElement('span');
            tempSpan.innerHTML = current;
            return [tempSpan.firstElementChild, 't'];
        }
    } else {
        let current = optimization(str.trim());
        if (current !== '') {
            if (regex_titles.test(current)) {
                // current = `<h2 id="line${lineNumber}"><a href='#line${lineNumber}' onclick='gotoLine(${lineNumber})' class='prevent-select title'>${current.replace(":", "").replace("：", "")}</a></h2>`;

                let tempAnchor = document.createElement('a');
                tempAnchor.href = `#line${lineNumber}`;
                tempAnchor.classList.add('prevent-select');
                tempAnchor.classList.add('title');
                tempAnchor.innerHTML = current.replace(":", "").replace("：", "");
                tempAnchor.addEventListener('click', function(event) {
                    // console.log("h2 Clicked");
                    event.preventDefault();
                    gotoLine(parseInt(this.parentElement.id.slice(4)));
                });
                let tempH2 = document.createElement('h2');
                tempH2.id = `line${lineNumber}`;
                tempH2.appendChild(tempAnchor);
                // current = tempH2.outerHTML;

                return [tempH2, 'h'];
            } else {
                if (to_drop_cap && !isEasternLan) {
                    isPunctuation = regex_isPunctuation.test(current[0]);
                    if (isPunctuation) {
                        index = 0
                        while (regex_isPunctuation.test(current[index])) {
                            index++;
                        }
                        // current = `<p id="line${lineNumber}" class="first"><span class="dropCap">${current.slice(0, index+1)}</span>${current.slice(index+1)}</p>`;
                        
                        let tempP = document.createElement('p');
                        tempP.id = `line${lineNumber}`;
                        tempP.classList.add('first');
                        let tempSpan = document.createElement('span');
                        tempSpan.classList.add('dropCap');
                        tempSpan.innerText = current.slice(0, index+1);
                        tempP.appendChild(tempSpan);
                        tempP.innerHTML += current.slice(index+1);

                        return [tempP, 'p'];
                    } else {
                        // current = `<p id="line${lineNumber}" class="first"><span class="dropCap">${current[0]}</span>${current.slice(1)}</p>`;
                        
                        let tempP = document.createElement('p');
                        tempP.id = `line${lineNumber}`;
                        tempP.classList.add('first');
                        let tempSpan = document.createElement('span');
                        tempSpan.classList.add('dropCap');
                        tempSpan.innerText = current[0];
                        tempP.appendChild(tempSpan);
                        tempP.innerHTML += current.slice(1);

                        return [tempP, 'p'];
                    }
                } else {
                    // current = `<p id="line${lineNumber}">${current}</p>`;
                    let tempP = document.createElement('p');
                    tempP.id = `line${lineNumber}`;
                    tempP.innerHTML = current;

                    return [tempP, 'p'];
                }
                // return [current, 'p'];
            }
        } else {
            // return [current, 'e'];
            let tempSpan = document.createElement('span');
            tempSpan.id = `line${lineNumber}`;
            tempSpan.innerText = current;
            return [tempSpan, 'e'];
        }
    }
}

function process(str, lineNumber, to_drop_cap) {
    if (logMode) {
        return processLogMode(str, lineNumber);
    } else {
        let ret = processBookMode(str, lineNumber, to_drop_cap);
        if (ret && ret[0]) {
            ret[0].setAttribute("data-line-num", lineNumber);
        }
        return ret;
    }
}

function processLogMode(str, lineNumber) {
    let tempP = document.createElement('p');
    tempP.id = `line${lineNumber}`;
    tempP.setAttribute("data-line-num", lineNumber);
    tempP.innerHTML = str;

    return [tempP, 'p'];
}

function getLanguage(str) {
    let current = str.trim();
    return regex_isEastern.test(current);
}

function getTitle(str) {
    let current = str.trim();
    if (regex_titles.test(current)) {
        return current.replace(":", "").replace("：", "");
    } else {
        return '';
    }
}

function safeREStr(str) {
    return str.replaceAll(/(.)/g, "\\$1");
}

function getBookNameAndAuthor(str) {
    let current = str.trim();
    // 增加书籍文件命名规则：书名.[作者]
    // current = current.replace("（校对版全本）", "");
    current = current.replace(/（(校对|精校|实体)[^）]*）/i, "");
    let bookInfo = {
        bookName: current,
        author: "",
        bookNameRE: current,
        authorRE: "",
    };
	let m = current.match(/^(?<name>.+)\.\[(?<author>.+)\]$/i);
	if (m) {
		bookInfo.bookName = m.groups["name"];
		bookInfo.author = m.groups["author"];
	}
    else if (regex_isEastern.test(current)) {
        let pos = current.toLowerCase().lastIndexOf("作者：");
        if (pos !== -1) {
            // bookInfo.bookName = current.slice(0, pos).replace("书名", "").replace("：", "").replace(":", "").replace("《", "").replace("》", "").replace("「", "").replace("」", "").replace("『", "").replace("』", "").replace("﹁", "").replace("﹂", "").replace("﹃", "").replace("﹄", "").trim();
            // bookInfo.author = current.slice(pos + 2).replace("：", "").replace("：", "").replace(":", "").replace("《", "").replace("》", "").replace("「", "").replace("」", "").replace("『", "").replace("』", "").replace("﹁", "").replace("﹂", "").replace("﹃", "").replace("﹄", "").trim();
            bookInfo.bookName = current.slice(0, pos).replaceAll(/(书名|[：:《》「」『』﹁﹂﹃﹄])/gi, "").trim();
            bookInfo.author = current.slice(pos + 3).replaceAll(/[：:《》「」『』﹁﹂﹃﹄]/gi, "").trim();
        }
    } else {
        let pos = current.toLowerCase().lastIndexOf(" by ");
        if (pos !== -1) {
            bookInfo.bookName = current.slice(0, pos).trim();
            bookInfo.author = current.slice(pos + 4).trim();
        }
    }
    bookInfo.bookNameRE = safeREStr(bookInfo.bookName);
    bookInfo.authorRE = safeREStr(bookInfo.author);
    return bookInfo;
}

function makeFootNote(str, footNoteImgPath) {
    let current = str.trim();

    // Find if footnote characters exist
    if (regex_isFootNote.test(current)) {        
        let allMatches = current.match(regex_isFootNote);

        if (allMatches.length == 1 && current.indexOf(allMatches[0]) == 0) {
            // this is the actual footnote itself
            // footNoteContainer.innerHTML += `<li id='fn${footnote_proccessed_counter}'>${current.slice(1)}</li>`;
            let tempLi = document.createElement('li');
            tempLi.id = `fn${footnote_proccessed_counter}`;
            tempLi.innerText = current.slice(1);
            footNoteContainer.appendChild(tempLi);
            footnote_proccessed_counter++;
            return "";
        } else {
            // main text
            for (i in allMatches) {
                // console.log("footnote.length: ", footnotes.length);
                // console.log("Found footnote: ", allMatches[i]);
                let curIndex = current.indexOf(allMatches[i]);
                current = `${current.slice(0, curIndex)}<a rel="footnote" href="#fn${footnotes.length}"><img class="footnote_img" src="${footNoteImgPath}"/></a>${current.slice(curIndex + 1)}`;
                footnotes.push(allMatches[i]);
            }
        }
    }

    return current;
}

function optimization(str) {
    let current = str.trim();

    // Remove symbols
    const reg_symbols = new RegExp(rules_symbols, "g");
    current = current.replace(reg_symbols, "").trim();

    // Remove 知轩藏书 specific elements
    const reg_zscs = new RegExp((rules_zxcs()).join("|"), "i");
    current = current.replace(reg_zscs, "").trim();

    // Remove 塞班 specific elements
    const reg_sb = new RegExp((rules_sb()).join("|"), "i");
    current = current.replace(reg_sb, "").trim();

    // Remove 99 specific elements
    const reg_99 = new RegExp((rules_99()).join("|"), "i");
    current = current.replace(reg_99, "").trim();

    // Remove 阡陌居 specific elements
    const reg_qmj = new RegExp((rules_qmj()).join("|"), "i");
    current = current.replace(reg_qmj, "").trim();

    // Remove 天天书屋 specific elements
    const reg_ttsw = new RegExp((rules_ttsw()).join("|"), "i");
    current = current.replace(reg_ttsw, "").trim();
    
    return current.trim();
}