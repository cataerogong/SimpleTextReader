var __STRe_ver__ = "0.1.0";

var STReHelper = {
	// hack helper
	getFuncArgs(func) {
		let re = /^\s*function\s*\w*\s*\(([^\)]*)\)[^{]*{.*}\s*$/si;
		let r = re.exec(func.toString());
		return r ? r[1] : "";
	},
	getFuncBody(func) {
		let re = /^\s*function\s*\w*\s*\([^\)]*\)[^{]*{(.*)}\s*$/si;
		let r = re.exec(func.toString());
		return r ? r[1] : "";
	},
	replaceFunc(funcOwner, funcName, funcCopyName, newFunc) {
		funcOwner[funcCopyName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(funcOwner[funcName]));
		funcOwner[funcName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(newFunc));
	},

	FUNC_KEYDOWN_: document.onkeydown, // 保存页面原来的 onkeydown 函数，下面会临时屏蔽 onkeydown

	freezeContent() {
		document.onkeydown = null;
		$("body").css("overflow-y", "hidden");
	},
	unfreezeContent() {
		document.onkeydown = this.FUNC_KEYDOWN_;
		$("body").css("overflow-y", "auto");
	},

	getCSS(sel, prop) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText === sel) {
					return rule.style.getPropertyValue(prop);
				}
			}
		}
		return null;
	},
	setCSS(sel, prop, val, defVal) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText === sel) {
					rule.style.setProperty(prop, val ? val : defVal);
				}
			}
		}
	},

	getServerFile(link, loadFunc = null) {
		let xhr = new XMLHttpRequest();
		xhr.open("get", link, !!loadFunc);
		// 实际使用中，小说文件没必要强制刷新，使用缓存更节省时间和流量
		// xhr.setRequestHeader("If-Modified-Since", "0"); // 强制刷新，不使用缓存
		xhr.responseType = "blob";
		if (loadFunc) {
			xhr.onload = loadFunc;
		}
		xhr.send();
		if (!loadFunc) return xhr.response;
	},

};

// 夹带点私货，我的小说命名规则是：书名.[作者]
STReHelper.replaceFunc(window, "getBookNameAndAuthor", "getBookNameAndAuthor____copy", function (str) {
	let current = str.trim();
	current = current.replace(/（(校对|精校)版?全本[^）]*）/i, "");
	let m = current.match(/^(.+)\.\[(.+)\]$/i);
	if (m) {
		return {
			"bookName": m[1].trim(),
			"author": m[2].trim()
		}
	}
	return getBookNameAndAuthor____copy(current);
});

// hack WebDAV.js functions
STReHelper.replaceFunc(WebDAV, "request", "request____copy", function () {
	headers["If-Modified-Since"] = "0"; // 强制刷新，不使用缓存
	// console.log(headers);
	return this.request____copy(verb, url, headers, data, type, callback);
});


// ------------------------------------------------
// Module <Settings>
// ------------------------------------------------
var STRe_Settings = {

	enabled: false,

	p_lineHeightDefault: STReHelper.getCSS(":root", "--p_lineHeight"),
	p_fontSizeDefault: STReHelper.getCSS(":root", "--p_fontSize"),
	light_fontColorDefault: STReHelper.getCSS(":root", "--fontColor"),
	light_bgColorDefault: STReHelper.getCSS(":root", "--bgColor"),
	dark_fontColorDefault: STReHelper.getCSS('[data-theme="dark"]', "--fontColor"),
	dark_bgColorDefault: STReHelper.getCSS('[data-theme="dark"]', "--bgColor"),
	pagination_bottomDefault: STReHelper.getCSS("#pagination", "bottom"),
	pagination_opacityDefault: STReHelper.getCSS("#pagination", "opacity"),

	p_lineHeight: "",
	p_fontSize: "",
	light_fontColor: "",
	light_bgColor: "",
	dark_fontColor: "",
	dark_bgColor: "",
	pagination_bottom: "",
	pagination_opacity: "",

	show() {
		$(`<dialog id="settingDlg">
<div><span id="settingDlgCloseBtn" class="dlg-close-btn">&times;</span></div>
<span class="dlg-body">
<div>
	<span>行高：</span>
	<input type="text" size="10" style="float:right" id="setting_p_lineHeight" value="${this.p_lineHeight}" />
</div>
<div>
	<span>字号：</span>
	<input type="text" size="10" id="setting_p_fontSize" value="${this.p_fontSize}" />
</div>
<div>
	<span>日间字符色：</span>
	<input type="text" size="10" id="setting_light_fontColor" value="${this.light_fontColor}" />
</div>
<div>
	<span>日间背景色：</span>
	<input type="text" size="10" id="setting_light_bgColor" value="${this.light_bgColor}" />
</div>
<div>
	<span>夜间字符色：</span>
	<input type="text" size="10" id="setting_dark_fontColor" value="${this.dark_fontColor}" />
</div>
<div>
	<span>夜间背景色：</span>
	<input type="text" size="10" id="setting_dark_bgColor" value="${this.dark_bgColor}" />
</div>
<div>
	<span>分页条与底部距离：</span>
	<input type="text" size="10" id="setting_pagination_bottom" value="${this.pagination_bottom}" />
</div>
<div>
	<span>分页条透明度(0.0~1.0)：</span>
	<input type="text" size="10" id="setting_pagination_opacity" value="${this.pagination_opacity}" />
</div>
<div style="padding:4px;margin-top:10px;">
	<button id="settingDlgClrBtn">恢复默认</button>
	<button id="settingDlgOkBtn" style="float:right;">应用</button>
</div>
</span>
</dialog>`).bind("cancel", () => this.hide()).insertAfter("#switch-btn");
		$("#settingDlgCloseBtn").click(() => this.hide());
		$("#settingDlgClrBtn").click(() => this.reset().load().apply().hide());
		$("#settingDlgOkBtn").click(() => this.save().apply().hide());
		STReHelper.freezeContent();
		document.getElementById("settingDlg").showModal();
		return this;
	},

	hide() {
		$("#settingDlg").remove();
		STReHelper.unfreezeContent();
		return this;
	},

	load() {
		this.p_lineHeight = localStorage.getItem("p_lineHeight") || this.p_lineHeightDefault;
		this.p_fontSize = localStorage.getItem("p_fontSize") || this.p_fontSizeDefault;
		this.light_fontColor = localStorage.getItem("light_fontColor") || this.light_fontColorDefault;
		this.light_bgColor = localStorage.getItem("light_bgColor") || this.light_bgColorDefault;
		this.dark_fontColor = localStorage.getItem("dark_fontColor") || this.dark_fontColorDefault;
		this.dark_bgColor = localStorage.getItem("dark_bgColor") || this.dark_bgColorDefault;
		this.pagination_bottom = localStorage.getItem("pagination_bottom") || this.pagination_bottomDefault;
		this.pagination_opacity = localStorage.getItem("pagination_opacity") || this.pagination_opacityDefault;
		return this;
	},

	save() {
		this.p_lineHeight = $("#setting_p_lineHeight").val() || this.p_lineHeightDefault;
		this.p_fontSize = $("#setting_p_fontSize").val() || this.p_fontSizeDefault;
		this.light_fontColor = $("#setting_light_fontColor").val() || this.light_fontColorDefault;
		this.light_bgColor = $("#setting_light_bgColor").val() || this.light_bgColorDefault;
		this.dark_fontColor = $("#setting_dark_fontColor").val() || this.dark_fontColorDefault;
		this.dark_bgColor = $("#setting_dark_bgColor").val() || this.dark_bgColorDefault;
		this.pagination_bottom = $("#setting_pagination_bottom").val() || this.pagination_bottomDefault;
		this.pagination_opacity = $("#setting_pagination_opacity").val() || this.pagination_opacityDefault;
		localStorage.setItem("p_lineHeight", this.p_lineHeight);
		localStorage.setItem("p_fontSize", this.p_fontSize);
		localStorage.setItem("light_fontColor", this.light_fontColor);
		localStorage.setItem("light_bgColor", this.light_bgColor);
		localStorage.setItem("dark_fontColor", this.dark_fontColor);
		localStorage.setItem("dark_bgColor", this.dark_bgColor);
		localStorage.setItem("pagination_bottom", this.pagination_bottom);
		localStorage.setItem("pagination_opacity", this.pagination_opacity);
		return this;
	},

	apply() {
		STReHelper.setCSS(":root", "--p_lineHeight", this.p_lineHeight, this.p_lineHeightDefault);
		STReHelper.setCSS(":root", "--p_fontSize", this.p_fontSize, this.p_fontSizeDefault);
		STReHelper.setCSS(":root", "--fontColor", this.light_fontColor, this.light_fontColorDefault);
		STReHelper.setCSS(":root", "--bgColor", this.light_bgColor, this.light_bgColorDefault);
		STReHelper.setCSS('[data-theme="dark"]', "--fontColor", this.dark_fontColor, this.dark_fontColorDefault);
		STReHelper.setCSS('[data-theme="dark"]', "--bgColor", this.dark_bgColor, this.dark_bgColorDefault);
		STReHelper.setCSS("#pagination", "bottom", this.pagination_bottom, this.pagination_bottomDefault);
		STReHelper.setCSS("#pagination", "opacity", this.pagination_opacity, this.pagination_opacityDefault);
		return this;
	},

	reset() {
		localStorage.removeItem("p_lineHeight");
		localStorage.removeItem("p_fontSize");
		localStorage.removeItem("light_fontColor");
		localStorage.removeItem("light_bgColor");
		localStorage.removeItem("dark_fontColor");
		localStorage.removeItem("dark_bgColor");
		localStorage.removeItem("pagination_bottom");
		localStorage.removeItem("pagination_opacity");
		return this;
	},

	enable() {
		this.load().apply();

		$(`<div id="STRe-setting-btn" class="btn-icon">
			<svg class="icon" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
				<path d="M546-80H414q-11 0-19.5-7T384-105l-16-101q-19-7-40-19t-37-25l-93 43q-11 5-22 1.5T159-220L93-337q-6-10-3-21t12-18l86-63q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-86-63q-9-7-12-18t3-21l66-117q6-11 17-14.5t22 1.5l93 43q16-13 37-25t40-18l16-102q2-11 10.5-18t19.5-7h132q11 0 19.5 7t10.5 18l16 101q19 7 40.5 18.5T669-710l93-43q11-5 22-1.5t17 14.5l66 116q6 10 3.5 21.5T858-584l-86 61q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l86 62q9 7 12 18t-3 21l-66 117q-6 11-17 14.5t-22-1.5l-93-43q-16 13-36.5 25.5T592-206l-16 101q-2 11-10.5 18T546-80Zm-66-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-60q-29 0-49.5-20.5T410-480q0-29 20.5-49.5T480-550q29 0 49.5 20.5T550-480q0 29-20.5 49.5T480-410Zm0-70Zm-44 340h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Z"/>
			</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));

		this.enabled = true;
		console.log("Module <Settings> enabled.");
		return this;
	},

	disable() {
		this.hide().reset().load().apply();
		$("#STRe-setting-btn").remove();
		console.log("Module <Settings> disabled.");
		this.enabled = false;
		return this;
	},
}


// ------------------------------------------------
// Module <Files On Server>
// ------------------------------------------------
var STRe_FilesOnServer = {

	enabled: false,

	STRe_SERVER: "", // "http://localhost:8001";
	STRe_TAG: "☁|",

	openServerFile(fname) {
		showLoadingScreen();
		this.hide();
		let link = this.STRe_SERVER + "/books/" + fname;
		STReHelper.getServerFile(link, (e) => {
			// localStorage.setItem(this.STReFile_ITEM, fname);
			e.target.response.name = this.STRe_TAG + fname;
			this.handleServerFile(e);
		});
	},

	handleServerFile: function (evt) { // 把获取服务端文件后的处理步骤抽象出来，以便将来替换这个处理步骤
		// console.log(this.response);
		resetVars();
		handleSelectedFile([evt.target.response]);
	},

	show() {
		$(`<dialog id="serverFilesDlg" style="height:100vh;min-width:50vw;">
			<div class="dlg-title-line"><span id="serverFilesDlgClose" class="dlg-close-btn">&times;</span></div>
			<span id="serverFilesDlgList" class="dlg-body" style="overflow-y:scroll;justify-content:center;">
				<img src="./images/loading_geometry.gif" style="display:block;width:30vw;filter:var(--mainColor_filter); "/>
			</span>
			</dialog>`).bind("cancel", () => this.hide()).insertAfter("#switch-btn");
		$("#serverFilesDlgClose").click(() => this.hide());
		STReHelper.freezeContent();
		document.getElementById("serverFilesDlg").showModal();

		let fs = WebDAV.Fs(this.STRe_SERVER);
		let fname_list = [];
		try {
			for (const f of fs.dir("/books").children()) {
				let fname = decodeURIComponent(f.name);
				if (fname.substring(fname.length - 4).toLowerCase() == ".txt")
					fname_list.push(fname);
			}
		} catch (e) {
			console.log(e);
		}
		fname_list.sort((a, b) => (a[0].localeCompare(b[0], "zh"))); // 拼音序
		// console.log(fname_list);
		let booklist = $("#serverFilesDlgList");
		booklist.html("");
		for (const fn of fname_list) {
			// booklist.append(`<div class="book-item ${fn[1] ? "book-read" : ""}" style="--book-progress:${fn[2]};"
			// title="${"进度：" + (fn[1] ? (fn[2] + " (" + fn[1] + ")") : "无")}" data-book-filename="${fn[0]}">${fn[0]}</div>`);
			booklist.append(`<div class="book-item" data-book-filename="${fn}">${fn}</div>`);
		}
		$(".book-item").click((evt) => this.openServerFile( evt.currentTarget.attributes["data-book-filename"].value));
		return this;
	},

	hide() {
		$('#serverFilesDlg').remove();
		STReHelper.unfreezeContent();
		return this;
	},

	enable() {
		$(`<div id="STRe-FOS-btn" class="btn-icon">
		<svg class="icon" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
			<path d="M251-160q-88 0-149.5-61.5T40-371q0-78 50-137t127-71q20-97 94-158.5T482-799q112 0 189 81.5T748-522v24q72-2 122 46.5T920-329q0 69-50 119t-119 50H251Zm0-60h500q45 0 77-32t32-77q0-45-32-77t-77-32h-63v-84q0-91-61-154t-149-63q-88 0-149.5 63T267-522h-19q-62 0-105 43.5T100-371q0 63 44 107t107 44Zm229-260Z"/>
		</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));

		this.enabled = true;
		console.log("Module <Files On Server> enabled.");
		return this;
	},

	disable() {
		this.hide();
		$("#STRe-FOS-btn").remove();
		console.log("Module <Files On Server> disabled.");
		this.enabled = false;
		return this;
	},
};

var STRe_ReopenFile = {

	enabled: false,

	STRe_FILE_ITEM: "STReFile",
	STReFile: "",

	handleServerFileBak: null,

	enable() {
		if (STRe_FilesOnServer.enabled) {
			// 替换获取服务器文件后的处理步骤，先记录当前文件名，以备下次重新打开
			this.handleServerFileBak = STRe_FilesOnServer.handleServerFile;
			STRe_FilesOnServer.handleServerFile = function (evt) {
				STRe_ReopenFile.handleServerFileBak(evt);
				localStorage.setItem(STRe_ReopenFile.STRe_FILE_ITEM, evt.target.response.name.substring(STRe_FilesOnServer.STRe_TAG.length));
			};
			// 获取之前的文件名，重新打开
			this.STReFile = localStorage.getItem(this.STRe_FILE_ITEM);
			if (this.STReFile) {
				STRe_FilesOnServer.openServerFile(this.STReFile);
			}
			this.enabled = true;
			console.log("Module <Reopen File on Start> enabled.");
		} else {
			this.enabled = false;
			console.log("Module <Reopen File on Start> not enabled, because <Files On Server> not enabled.");
		}
		return this;
	},

	disable() {
		if (this.handleServerFileBak) {
			STRe_FilesOnServer.handleServerFile = this.handleServerFileBak;
			this.handleServerFileBak = null;
		}
		console.log("Module <Reopen File on Start> disabled.");
		this.enabled = false;
		return this;
	},
};

// 	// ------------------------------------------------
// 	// Module <Progress On Server>
// 	// ------------------------------------------------
// 	addProgressOnServer() {
// 		const STRe_PROGRESS_RE = /^(\d+)(\/(\d+))?$/i;
// 		let STReProgressOnServer = false; // 服务端阅读进度

// 		let STReFileLine = ""; // STRe_TAG + filename + ":" + line

// 		// 检查服务端 '/progress' 目录是否存在
// 		try {
// 			WebDAV.Fs(STRe_SERVER).dir("/progress").children();
// 			STReProgressOnServer = true;
// 		} catch (e) {
// 			console.log("Can't access '/progress' on server. Turn off progress-on-server function.");
// 			STReProgressOnServer = false;
// 		}

// 		if (STReProgressOnServer) {
// 			for (const fp of fs.dir("/progress").children()) {
// 				let fname = decodeURIComponent(fp.name);
// 				if (fname.substring(fname.length - 9).toLowerCase() == ".progress") {
// 					fname = fname.substring(0, fname.length - 9);
// 					let fn = fname_list.find((e) => e[0].toLowerCase() == fname.toLowerCase());
// 					if (fn) {
// 						let m = fp.read().match(STRe_PROGRESS_RE);
// 						if (m) {
// 							fn[1] = m[1] + "/" + (m[3] || "?");
// 							fn[2] = m[3] ? (eval(m[0]) * 100).toFixed(1).replace(".0", "") + "%" : "";
// 						}
// 					}
// 				}
// 			}
// 		}
// 		function saveProgressToServer() {
// 			if (!STReProgressOnServer) // 不开启云端进度
// 				return;
// 			if ((filename) && (filename.substring(0, STRe_TAG.length) == STRe_TAG)) { // file on server
// 				if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
// 					// console.log("skip");
// 					return;
// 				}
// 				let line = getTopLineNumber(filename);
// 				if ((filename + ":" + line) != STReFileLine) {
// 					console.log("saveProgressToServer: " + filename + ":" + line + "/" + fileContentChunks.length);
// 					localStorage.setItem(STReFile_ITEM, filename.substring(STRe_TAG.length));
// 					let prog_file = WebDAV.Fs(STRe_SERVER).file("/progress/" + filename.substring(STRe_TAG.length) + ".progress");
// 					prog_file.write(line + "/" + fileContentChunks.length);
// 					STReFileLine = filename + ":" + line;
// 				}
// 			} else { // local file
// 				localStorage.removeItem(STReFile_ITEM);
// 				STReFileLine = "";
// 			}
// 		}

// 		function loadProgressFromServer(fname, onload) { // fname: 不带 STRe_TAG 的文件名
// 			if (!STReProgressOnServer) { // 不开启云端进度
// 				if (onload) {
// 					// console.log('loadProgressFromServer.onload');
// 					onload();
// 				}
// 				return;
// 			}
// 			WebDAV.Fs(STRe_SERVER).file("/progress/" + fname + ".progress").read((data) => {
// 				let m = data.match(STRe_PROGRESS_RE);
// 				if (m) { // 取到服务端进度，同步到 localStorage
// 					let line = parseInt(m[1]);
// 					console.log("loadProgressFromServer: " + fname + ":" + line);
// 					setHistory(STRe_TAG + fname, line);
// 					STReFileLine = STRe_TAG + fname + ":" + line;
// 				} else {
// 					STReFileLine = STRe_TAG + fname + ":" + (localStorage.getItem(STRe_TAG + fname) || 0);
// 				}
// 				if (onload) { // 进度已同步，继续处理
// 					// console.log('loadProgressFromServer.onload');
// 					onload();
// 				}
// 			});
// 		}

// 		function STReWorker() { // 定时将当前书在 localStorage 里的进度保存到服务器上
// 			saveProgressToServer();
// 			window.parent.document.title = document.title;
// 			setTimeout(STReWorker, 1000);
// 		}
// 		STReWorker();

// 		fname_list.sort((a, b) =>
// 		(!!a[1] == !!b[1]) // 判断阅读状态是否相同？（已读 or 未读） // ((a[1] && b[1]) || (!a[1] && !b[1]))
// 			? (a[0].localeCompare(b[0], "zh")) // 相同，按拼音序
// 			: (a[1] ? -1 : 1)); // 不同，已读排前面

// 	},

// 	// ------------------------------------------------
// 	// Book cache and shelf
// 	// ------------------------------------------------
// 	addBookShelf() {
// 		// let cache = await bc.GetBook(fname);
// 		// if (cache) {
// 		// 	console.log("Load book from cache.");
// 		// 	let resp = cache.response;
// 		// 	loadProgressFromServer(fname, () => {
// 		// 		resetVars();
// 		// 		localStorage.setItem(STReFile_ITEM, fname);
// 		// 		resp.name = STRe_TAG + fname;
// 		// 		handleSelectedFile([resp]);
// 		// 	});
// 		// } else {

// 		// }
// 		// 		console.log("Save book to cache.");
// 		// 		bc.PutBook({ filename: fname, response: this.response });

// 	}
// }

STRe_Settings.enable();
STRe_FilesOnServer.enable();
STRe_ReopenFile.enable();
