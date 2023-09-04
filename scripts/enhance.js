let _STRe_VER_ = "1.1.0";
let _STRe_SERVER_ = ""; // "http://localhost:8001";

var STReHelper = {
	// hack helper
	FUNC_RE: /^\s*(function)?\s*(?<name>\w*)\s*\((?<args>[^\)]*)\)[\s\r\n]*{(?<body>.*)}\s*$/si, // function F(a) {b}
	FUNC_RE2: /^\s*\((?<args>[^\)]*)\)[\s\r\n]*=>[\s\r\n]*{?(?<body>.*)}?\s*$/is, // (a) => {b}
	getFuncArgs(func) {
		let r = this.FUNC_RE.exec(func.toString()) || this.FUNC_RE2.exec(func.toString());
		return r ? r.groups["args"] : "";
	},
	getFuncBody(func) {
		let r = this.FUNC_RE.exec(func.toString()) || this.FUNC_RE2.exec(func.toString());
		return r ? r.groups["body"] : "";
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
	setCSS(sel, prop, val) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText === sel) {
					rule.style.setProperty(prop, val);
				}
			}
		}
	},

	isElmVisible(elm, pseudoElt = null) {
		let styles = window.getComputedStyle(elm, pseudoElt);
		return (styles["display"] != "none") && (styles["visibility"] != "hidden") && (styles["visibility"] != "collapse");
	},

	getLink(link, loadFunc = null) {
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
	getServerFile(fname, loadFunc = null) {
		return this.getLink(_STRe_SERVER_ + "/books/" + fname, loadFunc);
	},

	getProgress(fname, callback = null) {
		if (callback) {
			return WebDAV.Fs(_STRe_SERVER_).file("/progress/" + fname + ".progress").read(callback);
		} else {
			try {
				return WebDAV.Fs(_STRe_SERVER_).file("/progress/" + fname + ".progress").read();
			} catch (e) {
				console.log(e);
				return "";
			}
		}
	},
	putProgress(fname, data, callback = null) {
		if (callback) {
			WebDAV.Fs(_STRe_SERVER_).file("/progress/" + fname + ".progress").write(data, callback);
		} else {
			try {
				WebDAV.Fs(_STRe_SERVER_).file("/progress/" + fname + ".progress").write(data);
			} catch (e) {
				console.log(e);
			}
		}
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
	STRe_SETTINGS: "STReSettings",

	settings: {
		p_lineHeight: {
			val: "",
			def: STReHelper.getCSS(":root", "--p_lineHeight"),
			type: "text",
			desc: "行高",
			options: {},
			apply() { STReHelper.setCSS(":root", "--p_lineHeight", this.val || this.def); },
		},
		p_fontSize: {
			val: "",
			def: STReHelper.getCSS(":root", "--p_fontSize"),
			type: "text",
			desc: "字号",
			options: {},
			apply() { STReHelper.setCSS(":root", "--p_fontSize", this.val || this.def); },
		},
		fontColor: {
			val: "",
			def: STReHelper.getCSS(":root", "--fontColor"),
			type: "text",
			desc: "日间字符色",
			options: {},
			apply() { STReHelper.setCSS(":root", "--fontColor", this.val || this.def); },
		},
		bgColor: {
			val: "",
			def: STReHelper.getCSS(":root", "--bgColor"),
			type: "text",
			desc: "日间背景色",
			options: {},
			apply() { STReHelper.setCSS(":root", "--bgColor", this.val || this.def); },
		},
		dark_fontColor: {
			val: "",
			def: STReHelper.getCSS('[data-theme="dark"]', "--fontColor"),
			type: "text",
			desc: "夜间字符色",
			options: {},
			apply() { STReHelper.setCSS('[data-theme="dark"]', "--fontColor", this.val || this.def); },
		},
		dark_bgColor: {
			val: "",
			def: STReHelper.getCSS('[data-theme="dark"]', "--bgColor"),
			type: "text",
			desc: "夜间背景色",
			options: {},
			apply() { STReHelper.setCSS('[data-theme="dark"]', "--bgColor", this.val || this.def); },
		},
		pagination_bottom: {
			val: "",
			def: STReHelper.getCSS("#pagination", "bottom"),
			type: "text",
			desc: "分页条与底部距离",
			options: {},
			apply() { STReHelper.setCSS("#pagination", "bottom", this.val || this.def); },
		},
		pagination_opacity: {
			val: "",
			def: STReHelper.getCSS("#pagination", "opacity"),
			type: "text",
			desc: "分页条透明度(0.0~1.0)",
			options: {},
			apply() { STReHelper.setCSS("#pagination", "opacity", this.val || this.def); },
		},
		enableFos: {
			val: "",
			def: false,
			type: "checkbox",
			desc: "云端书库",
			options: {},
			apply() { this.val ? STRe_FilesOnServer.enable() : STRe_FilesOnServer.disable(); },
		},
		enablePos: {
			val: "",
			def: false,
			type: "checkbox",
			desc: "云端进度同步",
			options: {},
			apply() { this.val ? STRe_ProgressOnServer.enable() : STRe_ProgressOnServer.disable(); },
		},
		enableBookshelf: {
			val: "",
			def: true,
			type: "checkbox",
			desc: "本地缓存书架",
			options: {},
			apply() { this.val ? STRe_Bookshelf.enable() : STRe_Bookshelf.disable(); },
		},
		enableRos: {
			val: "",
			def: true,
			type: "checkbox",
			desc: "启动时打开上次阅读书籍",
			options: {},
			apply() { },
		},
	},

	genElmStr(key) {
		let s = this.settings[key];
		if (!s) return "";
		let str = "";
		switch (s.type) {
			case "checkbox":
				str = `<input type="checkbox" id="setting_${key}" ${s.val ? "checked" : ""} />
				<label for="setting_${key}">${s.desc}</label>`
				break;
			case "select":
				str = `<select id="setting_${key}">`;
				for (k in s.options) {
					str += `<option value="${k}" ${(k == s.val) ? "selected" : ""}>${s.options[k]}</option>`;
				}
				str += `</select>`;
				break;
			default:
				str = `<span>${s.desc}</span>
				<input type="text" size="10" style="float:right" id="setting_${key}" value="${s.val}" />`
				break;
		}
		return str;
	},

	show() {
		if (this.enabled) {
			let dlg = $(`<dialog id="settingDlg">
				<div class="dlg-cap">设置</div>
				<span class="dlg-body">
				<div style="font-size:125%;background-color:var(--mainColor);margin-bottom:1rem;">增强功能</div>
				<div>${this.genElmStr("enableFos")}</div>
				<div>${this.genElmStr("enablePos")}</div>
				<div>${this.genElmStr("enableBookshelf")}</div>
				<div>${this.genElmStr("enableRos")}</div>
				<div style="font-size:125%;background-color:var(--mainColor);margin:1rem 0;">阅读界面</div>
				<div>${this.genElmStr("p_lineHeight")}</div>
				<div>${this.genElmStr("p_fontSize")}</div>
				<div>${this.genElmStr("fontColor")}</div>
				<div>${this.genElmStr("bgColor")}</div>
				<div>${this.genElmStr("dark_fontColor")}</div>
				<div>${this.genElmStr("dark_bgColor")}</div>
				<div>${this.genElmStr("pagination_bottom")}</div>
				<div>${this.genElmStr("pagination_opacity")}</div>
				<hr />
				<div class="dlg-btn-grp"></div>
				</span>
				</dialog>`).bind("cancel", () => this.hide());
			dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
			dlg.find(".dlg-btn-grp").append($(`<button>恢复默认</button>`).click(() => this.reset().load().apply().hide()));
			dlg.find(".dlg-btn-grp").append($(`<button style="float:right;">应用</button>`).click(() => this.save().apply().hide()))
			STReHelper.freezeContent();
			dlg.appendTo("body");
			// document.getElementById("settingDlg").showModal();
			dlg[0].showModal();
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#settingDlg").remove();
			STReHelper.unfreezeContent();
		}
		return this;
	},

	load() {
		if (this.enabled) {
			let st = JSON.parse(localStorage.getItem(this.STRe_SETTINGS)) || {};
			for (key in this.settings) {
				this.settings[key].val = (key in st) ? st[key] : this.settings[key].def;
			}
		}
		return this;
	},

	save() {
		if (this.enabled) {
			let st = {};
			for (key in this.settings) {
				let s = this.settings[key];
				if (s.type == "checkbox") {
					s.val = document.getElementById("setting_" + key).checked;
				} else {
					s.val = $("#setting_" + key).val() || s.def;
				}
				st[key] = s.val;
			}
			localStorage.setItem(this.STRe_SETTINGS, JSON.stringify(st));
		}
		return this;
	},

	apply() {
		if (this.enabled) {
			for (s in this.settings) {
				this.settings[s].apply();
			}
		}
		return this;
	},

	reset() {
		if (this.enabled) {
			localStorage.removeItem(this.STRe_SETTINGS);
		}
		return this;
	},

	enable() {
		if (!this.enabled) {
			$(`<div id="STRe-setting-btn" class="btn-icon">
				<svg class="icon" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
					<path d="M546-80H414q-11 0-19.5-7T384-105l-16-101q-19-7-40-19t-37-25l-93 43q-11 5-22 1.5T159-220L93-337q-6-10-3-21t12-18l86-63q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-86-63q-9-7-12-18t3-21l66-117q6-11 17-14.5t22 1.5l93 43q16-13 37-25t40-18l16-102q2-11 10.5-18t19.5-7h132q11 0 19.5 7t10.5 18l16 101q19 7 40.5 18.5T669-710l93-43q11-5 22-1.5t17 14.5l66 116q6 10 3.5 21.5T858-584l-86 61q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l86 62q9 7 12 18t-3 21l-66 117q-6 11-17 14.5t-22-1.5l-93-43q-16 13-36.5 25.5T592-206l-16 101q-2 11-10.5 18T546-80Zm-66-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-60q-29 0-49.5-20.5T410-480q0-29 20.5-49.5T480-550q29 0 49.5 20.5T550-480q0 29-20.5 49.5T480-410Zm0-70Zm-44 340h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Z"/>
				</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));
			this.enabled = true;
			console.log("Module <Settings> enabled.");
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			this.hide().reset().load().apply();
			$("#STRe-setting-btn").remove();
			this.enabled = false;
			console.log("Module <Settings> disabled.");
		}
		return this;
	},
}


// ------------------------------------------------
// Module <Files on Server>
// ------------------------------------------------
var STRe_FilesOnServer = {

	enabled: false,

	openFile(fname, onSucc = null) {
		console.log("STRe_FilesOnServer.openFile: " + fname);
		showLoadingScreen();
		STReHelper.getServerFile(fname, (e) => {
			e.target.response.name = fname;
			resetVars();
			handleSelectedFile([e.target.response]);
			if (onSucc) onSucc();
		});
	},

	show() {
		if (this.enabled) {
			let dlg = $(`<dialog id="serverFilesDlg" class="files-on-server-dlg">
				<div class="dlg-cap">云端书库</div>
				<span class="dlg-body">
					<img src="./images/loading_geometry.gif" style="display:block;width:30vw;filter:var(--mainColor_filter); "/>
				</span>
				</dialog>`).bind("cancel", () => this.hide());
			dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
			STReHelper.freezeContent();
			// document.getElementById("serverFilesDlg").showModal();
			dlg.appendTo("body");
			dlg[0].showModal();

			let fs = WebDAV.Fs(_STRe_SERVER_);
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
			let booklist = dlg.find(".dlg-body");
			booklist.html("");
			for (const fn of fname_list) {
				// booklist.append(`<div class="book-item ${fn[1] ? "book-read" : ""}" style="--book-progress:${fn[2]};"
				// title="${"进度：" + (fn[1] ? (fn[2] + " (" + fn[1] + ")") : "无")}" data-book-filename="${fn[0]}">${fn[0]}</div>`);
				$(`<div class="book-item" data-filename="${fn}">${fn}</div>`).click(() => {
					this.hide();
					this.openFile(fn);
				}).appendTo(booklist);
			}
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$('#serverFilesDlg').remove();
			STReHelper.unfreezeContent();
		}
		return this;
	},

	enable() {
		if (!this.enabled) {
			// 检查服务端 '/books' 目录是否存在
			try {
				WebDAV.Fs(_STRe_SERVER_).dir("/books").children();
				$(`<div id="STRe-FOS-btn" class="btn-icon">
				<svg class="icon" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
					<path d="M251-160q-88 0-149.5-61.5T40-371q0-78 50-137t127-71q20-97 94-158.5T482-799q112 0 189 81.5T748-522v24q72-2 122 46.5T920-329q0 69-50 119t-119 50H251Zm0-60h500q45 0 77-32t32-77q0-45-32-77t-77-32h-63v-84q0-91-61-154t-149-63q-88 0-149.5 63T267-522h-19q-62 0-105 43.5T100-371q0 63 44 107t107 44Zm229-260Z"/>
				</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));
				this.enabled = true;
				console.log("Module <Files on Server> enabled.");
			} catch (e) {
				console.log("Module <Files on Server> not enabled, because can't access '/books' on server.");
				this.enabled = false;
			}
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			this.hide();
			$("#STRe-FOS-btn").remove();
			this.enabled = false;
			console.log("Module <Files on Server> disabled.");
		}
		return this;
	},
};

// ------------------------------------------------
// Module <Progress on Server>
// ------------------------------------------------
var STRe_ProgressOnServer = {

	enabled: false,
	pauseSave: false,

	STRe_PROGRESS_RE: /^(?<line>\d+)(\/(?<total>\d+))?$/i, // 格式：line/total，match() 的结果：[full, line, /total, total]
	STReFileLine: "", // STRe_TAG + filename + ":" + line
	STReFile: "",

	saveProgress() {
		if (!this.enabled) return; // 不开启云端进度
		if (this.pauseSave) return; // 正在等用户决定是否同步
		if (filename) {
			if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
				return;
			}
			let line = getTopLineNumber(filename);
			if ((filename + ":" + line) != this.STReFileLine) {
				console.log("Save progress on server: " + filename + ":" + line + "/" + fileContentChunks.length);
				STReHelper.putProgress(filename, line + "/" + fileContentChunks.length);
				this.STReFileLine = filename + ":" + line;
			}
		}
	},

	syncProgress(data) {
		let m = data.match(this.STRe_PROGRESS_RE);
		if (m) { // 取到服务端进度
			// let line = parseInt(m[1]);
			let line = parseInt(m.groups["line"]);
			if (line == getTopLineNumber()) { // 进度一致，无需同步
				this.STReFileLine = filename + ":" + line;
			} else { // 进度不一致

				function hide() {
					$('#syncProgressDlg').remove();
					STReHelper.unfreezeContent();
					STRe_ProgressOnServer.pauseSave = false;
				}

				let dlg = $(`<dialog id="syncProgressDlg">
					<div class="dlg-cap">云端进度同步</div>
					<div class="dlg-body" style="line-height:2em;">
						<div>当前阅读进度：${getTopLineNumber()}/${fileContentChunks.length}</div>
						<div>发现云端进度：${data}</div>
						<div>是否跳转到云端进度？</div>
						<hr />
						<div class="dlg-btn-grp"></div>
					</div>
					</dialog>`).bind("cancel", hide);
				dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(hide));
				dlg.find(".dlg-btn-grp").append($(`<button style="float:left;">是</button>`).click(() => {
					console.log("Load progress on server: " + filename + ":" + data);
					hide();
					setHistory(filename, line);
					getHistory(filename);
					this.STReFileLine = filename + ":" + line;
				}));
				dlg.find(".dlg-btn-grp").append($(`<button style="float:right;">否</button>`).click(hide));
				STReHelper.freezeContent();
				dlg.appendTo("body");
				dlg[0].showModal();
				this.pauseSave = true;
			}
		}
	},

	loadProgress() {
		if (!this.enabled) return;
		if (filename) {
			if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
				return;
			}
			if (this.STReFile != filename) { // 只在更换文件时同步进度
				console.log("Check progress on server: " + filename);
				this.syncProgress(STReHelper.getProgress(filename));
			}
		}
		this.STReFile = filename;
	},

	loop() { // 定时同步进度
		if (this.enabled) {
			this.loadProgress();
			this.saveProgress();
			setTimeout(() => this.loop(), 1000);
		}
	},

	enable() {
		if (!this.enabled) {
			// 检查服务端 '/progress' 目录是否存在且可写
			try {
				let test = "TEST TIMESTAMP: " + new Date().getTime();
				let f = WebDAV.Fs(_STRe_SERVER_).file("/progress/!STRe!.txt");
				f.write(test);
				if (f.read() == test) {
					this.enabled = true;
					console.log("Module <Progress on Server> enabled.");
				} else {
					this.enabled = false;
					console.log("Module <Progress on Server> not enabled, because can't access '/progress' on server.");
				}
			} catch (e) {
				this.enabled = false;
				console.log("Module <Progress on Server> not enabled, because can't access '/progress' on server.");
			}
			setTimeout(() => this.loop(), 1000);
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			this.enabled = false;
			console.log("Module <Files on Server> disabled.");
		}
		return this;
	},
};


// ------------------------------------------------
// Module <Bookshelf>
// ------------------------------------------------
var STRe_Bookshelf = {

	enabled: false,
	db: null,

	STRe_FILE: "STReFile",
	// STRe_POS_CLOUD: "WebDAV",
	// STRe_POS_LOCAL: "indexedDB",
	STRe_TAG_CLOUD: "☁",
	STRe_TAG_LOCAL: "💻",

	async reopenFile() {
		if (this.enabled) {
			// 获取之前的文件名，重新打开
			let fname = localStorage.getItem(this.STRe_FILE);
			if (fname) {
				if (await STRe_Bookshelf.isFileExist(fname)) {
					STRe_Bookshelf.openFile(fname);
				}
			}
		}
	},

	openFile(fname, onSucc = null) {
		if (this.enabled) {
			console.log("STRe_Bookshelf.openFile: " + fname);
			showLoadingScreen();
			this.db.getBook(fname).then((book) => {
				if (book) {
					book.name = fname;
					resetVars();
					handleSelectedFile([book]);
					if (onSucc) onSucc();
				} else {
					alert("发生错误！");
				}
			});
		}
	},

	async saveFile(file) {
		if (this.enabled) {
			await this.db.putBook(file.name, file);
		}
	},

	async isFileExist(fname) {
		if (this.enabled) {
			return await this.db.isBookExist(fname);
		} else {
			return false;
		}
	},

	async deleteFile(fname, onSucc = null) {
		if (this.enabled) {
			this.db.deleteBook(fname).then(() => {
				if (onSucc) onSucc();
			});
		}
	},

	genBookItem(name) {
		let book = $(`<div class="book"><div><span class="delete-btn" data-filename="${name}">&times;</span></div>
			<div class="cover" data-filename="${name}">${name}</div></div>`);
		book.find(".cover").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.hide();
			this.openFile(name);
		});
		book.find(".delete-btn").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.deleteFile(name, () => this.freshBookList());
		});
		let progress = localStorage.getItem(name);
		let pct = "?%";
		let cover = book.find(".cover")
		if (progress) {
			let m = progress.match(/^(?<line>\d+)\/(?<total>\d+)?$/i);
			if (m) {
				pct = (eval(progress)*100).toFixed(1)+"%";
				cover.addClass("book-read").css("--read-progress", pct);
			}
			cover.attr("title", "阅读进度："+pct+" ("+progress+")");
		} else {
			cover.attr("title", "阅读进度：无");
		}
		return book;
	},

	async freshBookList() {
		if (this.enabled) {
			let container = $(".bookshelf .dlg-body");
			container.html("");
			let booklist = [];
			for (const book of await this.db.getAllBooks()) {
				booklist.push(book.name);
			}
			booklist.sort((a, b) => (a.localeCompare(b, "zh")));
			for (const name of booklist) {
				container.append(this.genBookItem(name));
			}
		}
	},

	async show(inDropZone = true) {
		if (this.enabled) {
			let bookshelf = $(`<div class="bookshelf">
				<div class="dlg-cap">本地缓存书架</div>
				<span class="dlg-body"></span>
				</div>`);
			if (inDropZone) {
				let frm = $(`<div class="dlg bookshelf-dz"></div>`);
				bookshelf.find(".dlg-cap").after($(`<div style="font-size:1rem;font-family:ui;text-align:center;">添加书籍：拖入文件 / 空白处双击${STRe_Settings.settings.enableFos.val ? " / 云端书库" : ""}</div>`));
				frm.append(bookshelf);
				frm.appendTo("#dropZone");
			} else if (!STReHelper.isElmVisible(document.getElementById("dropZone"))) {
				let frm = $(`<dialog id="bookshelfDlg" class="bookshelf-dlg"></dialog>`).bind("cancel", () => this.hide());
				bookshelf.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
				frm.append(bookshelf);
				STReHelper.freezeContent();
				frm.appendTo("body");
				frm[0].showModal();
			}
			this.freshBookList();
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#bookshelfDlg").remove();
			STReHelper.unfreezeContent();
		}
		return this;
	},

	loop() {
		if (this.enabled) {
			localStorage.setItem(this.STRe_FILE, filename);
			setTimeout(() => this.loop(), 1000);
		}
	},

	enable() {
		// 替换 handleSelectedFile 函数
		function handleSelectedFile__hack(fileList) {
			if (fileList.length > 0 && fileList[0].type === "text/plain") {
				// 先把文件保存到缓存db中
				STRe_Bookshelf.saveFile(fileList[0])
					.then(() => {
						// 刷新 Bookshelf in DropZone
						STRe_Bookshelf.freshBookList();
					})
					.finally(() => {
						handSelectedFile__ORIGIN(fileList);
					});
			}
		}

		if (!this.enabled) {
			this.db = new STReLocalDB();
			STReHelper.replaceFunc(window, "handleSelectedFile", "handSelectedFile__ORIGIN", handleSelectedFile__hack);
			$(`<div id="STRe-bookshelf-btn" class="btn-icon">
			<svg class="icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="fill:none;">
				<rect width="18" height="40" rx="5" ry="5" stroke-width="6" transform="translate(15,35)" />
				<rect width="20" height="60" rx="5" ry="5" stroke-width="6" transform="translate(40,15)" />
				<rect width="18" height="50" rx="5" ry="5" stroke-width="6" transform="translate(65,25),rotate(-10)" />
			</svg></div>`).click(() => this.show(false)).prependTo($("#btnWrapper"));
			this.enabled = true;
			this.show(true);
			console.log("Module <Bookshelf> enabled.");
			setTimeout(() => this.loop(), 1000);
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			STReHelper.replaceFunc(window, "handleSelectedFile", "abandonFunc__STRe_Bookshelf", handSelectedFile__ORIGIN);
			$(".bookshelf-dz").remove();
			$("#bookshelfDlg").remove();
			$("#STRe-bookshelf-btn").remove();
			this.db = null;
			this.enabled = false;
			console.log("Module <Bookshelf> disabled.");
		}
		return this;
	},
};


STRe_Settings.enable().load().apply();

// 启动时打开上次阅读书籍
if (STRe_Settings.settings.enableRos.val) {
	STRe_Bookshelf.reopenFile();
}

// STRe_Bookshelf.enable().setMode(true);

// STRe_FilesOnServer.enable();
// STRe_ProgressOnServer.enable();
