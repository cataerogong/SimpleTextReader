let _STRe_VER_ = "1.2.1";

let DPR = window.devicePixelRatio;

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

	async fetchLink(link) {
		try {
			let resp = await fetch(link, {
				credentials: "include",
			});
			return (resp.ok ? resp : null);
		} catch (e) {
			console.log(e);
			return null;
		}
	}
};

// 夹带点私货，我的小说命名规则是：书名.[作者]
STReHelper.replaceFunc(window, "getBookNameAndAuthor", "getBookNameAndAuthor____copy", function (str) {
	let current = str.trim();
	current = current.replace(/（(校对|精校)版?全本[^）]*）/i, "");
	let m = current.match(/^(?<name>.+)\.\[(?<author>.+)\]$/i);
	if (m) {
		return {
			"bookName": m.groups["name"],
			"author": m.groups["author"]
		}
	}
	return getBookNameAndAuthor____copy(current);
});


// ------------------------------------------------
// Module <Settings>
// ------------------------------------------------
var STRe_Settings = {

	enabled: false,
	ITEM_SETTINGS: "STReSettings",

	settings: {
		p_lineHeight: {
			val: "",
			def: STReHelper.getCSS(":root", "--p_lineHeight"),
			type: "text", // text, int, bool, select
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
		fosWebDAV: {
			val: "",
			def: "/books",
			type: "text",
			desc: "WebDAV 地址",
			options: {},
			apply() { STRe_FilesOnServer.webDAVdir = this.val.trimEnd().replace(/\/*$/, ""); },
		},
		enableFos: {
			val: null,
			def: false,
			type: "bool",
			desc: "云端书库",
			options: {},
			apply() { this.val ? STRe_FilesOnServer.enable() : STRe_FilesOnServer.disable(); },
		},
		posWebDAV: {
			val: "",
			def: "/progress",
			type: "text",
			desc: "WebDAV 地址",
			options: {},
			apply() { STRe_ProgressOnServer.webDAVdir = this.val.trimEnd().replace(/\/*$/, ""); },
		},
		posInterval: {
			val: 1,
			def: 1,
			type: "int",
			desc: "自动同步间隔",
			options: {},
			apply() { STRe_ProgressOnServer.syncInterval = this.val; },
		},
		enablePos: {
			val: null,
			def: false,
			type: "bool",
			desc: "云端进度",
			options: {},
			apply() { this.val ? STRe_ProgressOnServer.enable() : STRe_ProgressOnServer.disable(); },
		},
		enableBookshelf: {
			val: null,
			def: true,
			type: "bool",
			desc: "本地缓存书架",
			options: {},
			apply() { this.val ? STRe_Bookshelf.enable() : STRe_Bookshelf.disable(); },
		},
		enableRos: {
			val: null,
			def: true,
			type: "bool",
			desc: "启动时打开上次阅读书籍",
			options: {},
			apply() { },
		},
	},

	genInput(key, style="", cls="") {
		let s = this.settings[key];
		if (!s) return "";
		switch (s.type) {
			case "bool":
				return `<input type="checkbox" class="${cls}" style="${style}" id="setting_${key}" ${s.val ? "checked" : ""} />`;
			case "select": {
				let str = `<select class="${cls}" style="${style}" id="setting_${key}">`;
				for (k in s.options) {
					str += `<option value="${k}" ${(k == s.val) ? "selected" : ""}>${s.options[k]}</option>`;
				}
				str += `</select>`;
				return str;
			}
			case "int":
			case "+int":
			case "-int":
				return `<input type="text" class="${cls}" style="text-align:right;${style}" id="setting_${key}" value="${s.val}" />`;
			case "text":
			default:
				return `<input type="text" class="${cls}" style="width:6rem;${style}" id="setting_${key}" value="${s.val}" />`;
		}
	},
	getLabel(key, style="", cls="") {
		let s = this.settings[key];
		if (!s) return "";
		switch (s.type) {
			case "bool":
				return `<label for="setting_${key}" class="${cls}" style="${style}">${s.desc}</label>`;
			case "select":
			case "int":
			case "+int":
			case "-int":
			case "text":
			default:
				return `<div class="${cls}" style="display:inline-block;${style}">${s.desc}</div>`;
		}
	},

	show() {
		if (this.enabled) {
			this.settings.enableFos.val = STRe_FilesOnServer.enabled;
			this.settings.enablePos.val = STRe_ProgressOnServer.enabled;
			this.settings.enableBookshelf.val = STRe_Bookshelf.enabled;
			let dlg = $(`<dialog id="settingDlg">
				<div class="dlg-cap">设置</div>
				<span class="dlg-body">
				<div class="sub-cap">增强功能</div>
				<div class="fn-setting-wrapper">
				<div class="row">${this.genInput("enableFos")} ${this.getLabel("enableFos")}</div>
				${this.getLabel("fosWebDAV", "", "lv-2")} ${this.genInput("fosWebDAV", "width:20rem;")}
				<div class="row">${this.genInput("enablePos")} ${this.getLabel("enablePos")}</div>
				${this.getLabel("posWebDAV", "", "lv-2")} ${this.genInput("posWebDAV", "width:20rem;")}
				${this.getLabel("posInterval", "", "lv-2")} <span>${this.genInput("posInterval", "width:2rem;")}秒（0 表示关闭自动同步）</span>
				<div class="row">${this.genInput("enableBookshelf")} ${this.getLabel("enableBookshelf")}</div>
				<div class="row lv-2">${this.genInput("enableRos")} ${this.getLabel("enableRos")}</div>
				</div>
				<div class="sub-cap">阅读界面</div>
				<div class="ui-setting-wrapper">
				${this.getLabel("p_lineHeight", "text-align: right")} ${this.genInput("p_lineHeight")}
				${this.getLabel("p_fontSize", "text-align: right")} ${this.genInput("p_fontSize")}
				${this.getLabel("fontColor", "text-align: right")} ${this.genInput("fontColor")}
				${this.getLabel("bgColor", "text-align: right")} ${this.genInput("bgColor")}
				${this.getLabel("dark_fontColor", "text-align: right")} ${this.genInput("dark_fontColor")}
				${this.getLabel("dark_bgColor", "text-align: right")} ${this.genInput("dark_bgColor")}
				${this.getLabel("pagination_bottom", "text-align: right")} ${this.genInput("pagination_bottom")}
				${this.getLabel("pagination_opacity", "text-align: right")} ${this.genInput("pagination_opacity")}
				</div>
				<hr />
				</span>
				<div class="dlg-btn-grp"></div>
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
			let st = JSON.parse(localStorage.getItem(this.ITEM_SETTINGS)) || {};
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
				switch (s.type) {
					case "bool":
						s.val = document.getElementById("setting_" + key).checked;
						break;
					case "int": {
						let v = parseInt($("#setting_" + key).val());
						s.val = isNaN(v) ? s.def : v;
						break;
					}
					case "+int": {
						let v = parseInt($("#setting_" + key).val());
						s.val = (isNaN(v) || v <= 0) ? s.def : v;
						break;
					}
					case "-int": {
						let v = parseInt($("#setting_" + key).val());
						s.val = (isNaN(v) || v >= 0) ? s.def : v;
						break;
					}
					default:
						s.val = $("#setting_" + key).val() || s.def;
						break;
				}
				st[key] = s.val;
			}
			localStorage.setItem(this.ITEM_SETTINGS, JSON.stringify(st));
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
			localStorage.removeItem(this.ITEM_SETTINGS);
		}
		return this;
	},

	enable() {
		if (!this.enabled) {
			$(`<div id="STRe-setting-btn" class="btn-icon">
				<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path stroke="none" d="M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2m-2 12c-.25 0-.46-.18-.5-.42l-.37-2.65c-.63-.25-1.17-.59-1.69-.99l-2.49 1.01c-.22.08-.49 0-.61-.22l-2-3.46a.493.493 0 0 1 .12-.64l2.11-1.66L4.5 12l.07-1l-2.11-1.63a.493.493 0 0 1-.12-.64l2-3.46c.12-.22.39-.31.61-.22l2.49 1c.52-.39 1.06-.73 1.69-.98l.37-2.65c.04-.24.25-.42.5-.42h4c.25 0 .46.18.5.42l.37 2.65c.63.25 1.17.59 1.69.98l2.49-1c.22-.09.49 0 .61.22l2 3.46c.13.22.07.49-.12.64L19.43 11l.07 1l-.07 1l2.11 1.63c.19.15.25.42.12.64l-2 3.46c-.12.22-.39.31-.61.22l-2.49-1c-.52.39-1.06.73-1.69.98l-.37 2.65c-.04.24-.25.42-.5.42h-4m1.25-18l-.37 2.61c-1.2.25-2.26.89-3.03 1.78L5.44 7.35l-.75 1.3L6.8 10.2a5.55 5.55 0 0 0 0 3.6l-2.12 1.56l.75 1.3l2.43-1.04c.77.88 1.82 1.52 3.01 1.76l.37 2.62h1.52l.37-2.61c1.19-.25 2.24-.89 3.01-1.77l2.43 1.04l.75-1.3l-2.12-1.55c.4-1.17.4-2.44 0-3.61l2.11-1.55l-.75-1.3l-2.41 1.04a5.42 5.42 0 0 0-3.03-1.77L12.75 4h-1.5Z"/>
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
	webDAVdir: "", // http://WebDAV/books

	openFile(fname) {
		console.log("STRe_FilesOnServer.openFile: " + fname);
		showLoadingScreen();
		STReHelper.fetchLink(this.webDAVdir + "/" + fname).then((resp) => {
			if (!resp) return;
			resp.blob().then((blob) => {
				blob.name = fname;
				let f = new File([blob], fname, {type: "text/plain"})
				resetVars();
				handleSelectedFile([f]);
			});
		}).catch((e) => console.log(e));
	},

	async show() {
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

			// let fs = WebDAV.Fs(_STRe_SERVER_);
			let dir = WebDAV.Fs("").dir(this.webDAVdir);
			let fname_list = [];
			try {
				// for (const f of fs.dir("/books").children()) {
				for (const f of await dir.children()) {
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
				let book = $(`<div class="book" data-filename="${fn}">${fn}</div>`).click(() => {
					this.hide();
					this.openFile(fn);
				}).appendTo(booklist);
				let progress = localStorage.getItem(fn);
				let pct = "?%";
				if (progress) {
					let m = progress.match(/^(?<line>\d+)\/(?<total>\d+)?$/i);
					if (m) {
						pct = (eval(progress) * 100).toFixed(0) + "%";
						book.addClass("read").css("--read-progress", pct);
					}
					book.attr("title", "阅读进度：" + pct + " (" + progress + ")");
				} else {
					book.attr("title", "阅读进度：无");
				}
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

	async enable() {
		if (!this.enabled) {
			// 检查服务端 '/books' 目录是否存在
			try {
				await WebDAV.Fs("").dir(this.webDAVdir).children();
				$(`<div id="STRe-FOS-btn" class="btn-icon">
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path stroke="none" d="M15 15H9v-1h6v1m0 1H9v1h6v-1m0 2H9v1h6v-1m8-4.5c0 1.25-.44 2.31-1.31 3.19c-.88.87-1.94 1.31-3.19 1.31H18v4H6v-4.05c-1.3-.1-2.43-.59-3.39-1.52C1.54 15.38 1 14.09 1 12.58c0-1.3.39-2.46 1.17-3.48S4 7.43 5.25 7.15c.42-1.53 1.25-2.77 2.5-3.72S10.42 2 12 2c1.95 0 3.6.68 4.96 2.04C18.32 5.4 19 7.05 19 9c1.15.13 2.1.63 2.86 1.5c.76.85 1.14 1.85 1.14 3M6 15.95V11h11V9c0-1.38-.5-2.56-1.46-3.54C14.56 4.5 13.38 4 12 4s-2.56.5-3.54 1.46C7.5 6.44 7 7.62 7 9h-.5c-.97 0-1.79.34-2.47 1.03c-.69.68-1.03 1.5-1.03 2.47s.34 1.79 1.03 2.5c.56.54 1.22.85 1.97.95M16 13H8v7h8v-7m5 .5c0-.7-.24-1.29-.73-1.77S19.2 11 18.5 11H18v5h.5c.7 0 1.29-.24 1.77-.72S21 14.2 21 13.5Z"/>
					</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));
				this.enabled = true;
				console.log("Module <Files on Server> enabled.");
			} catch (e) {
				console.log(e);
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
	syncOnFileLoad: false,

	STRe_PROGRESS_RE: /^(?<line>\d+)(\/(?<total>\d+))?$/i, // 格式：line/total，match() 的结果：[full, line, /total, total]
	STReFileLine: "", // filename + ":" + line 记录之前的文件和行数，改变才同步到云端，减少同步次数

	webDAVdir: "", // http://WebDAV/progress
	syncInterval: 1, // 同步间隔（秒）

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
				try {
					WebDAV.Fs("").file(this.webDAVdir + "/" + filename + ".progress")
						.write(line + "/" + fileContentChunks.length)
						.catch(e => console.log(e))
						.finally(() => {
							this.STReFileLine = filename + ":" + line;
						});
				} catch (e) {
					console.log(e);
				}
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

				this.pauseSave = true;
				let dlg = $(`<dialog id="syncProgressDlg">
					<div class="dlg-cap">云端进度同步</div>
					<div class="dlg-body" style="line-height:2em;">
						<div>当前阅读进度：<span style="float:right;">${getTopLineNumber()}/${fileContentChunks.length}</span></div>
						<div>发现云端进度：<span style="float:right;">${data}</span></div>
						<div>是否跳转到云端进度？</div>
						<hr />
						<div class="dlg-btn-grp"></div>
					</div>
					</dialog>`).bind("cancel", hide);
				dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(hide));
				dlg.find(".dlg-btn-grp")
					.append($(`<button style="float:left;">是</button>`).click(() => {
						console.log("Load progress on server: " + filename + ":" + data);
						hide();
						setHistory(filename, line);
						getHistory(filename);
						this.STReFileLine = filename + ":" + line;
					}))
					.append($(`<button style="float:right;">否</button>`).click(hide));
				STReHelper.freezeContent();
				dlg.appendTo("body");
				dlg[0].showModal();
			}
		}
	},

	async loadProgress() {
		if (!STRe_ProgressOnServer.enabled) return;
		if (!STRe_ProgressOnServer.syncOnFileLoad) return;
		if (filename) {
			console.log("Check progress on server: " + filename);
			try {
				let progress = await WebDAV.Fs("").file(STRe_ProgressOnServer.webDAVdir + "/" + filename + ".progress").read();
				if (progress) STRe_ProgressOnServer.syncProgress(progress);
			} catch (e) {
				console.log(e);
			}
		}
	},

	loop() { // 定时同步进度
		if (this.enabled) {
			if (this.syncInterval > 0) {
				this.syncOnFileLoad = true;
				this.saveProgress();
				setTimeout(() => this.loop(), this.syncInterval * 1000);
			} else {
				this.syncOnFileLoad = false;
				setTimeout(() => this.loop(), 1000);
			}
		}
	},

	async show() {
		if (this.enabled) {
			let dlg = $(`<dialog id="progressDlg" class="">
				<div class="dlg-cap">阅读进度</div>
				<span class="dlg-body progress-list">
				</span>
				<div class="dlg-btn-grp" style="margin-bottom: 1rem;"></div>
				</dialog>`).bind("cancel", () => this.hide());
			dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
			dlg.find(`.dlg-btn-grp`)
				.append($(`<input type="checkbox" id="progressDlgChk" />`)
					.change(evt => { evt.currentTarget.checked ? $("#progressDlg .dlg-body div.eq").show() : $("#progressDlg .dlg-body div.eq").hide(); }))
				.append(`<label for="progressDlgChk">显示进度一致的书籍</label>`)
				.append($(`<span style="float:right"></span>`)
					.append(`<span>云端&nbsp;</span>`)
					.append($(`<button> &lt; </button>`).click())
					.append($(`<button> &gt; </button>`).click())
					.append(`<span>&nbsp;本地</span>`)
				);
			STReHelper.freezeContent();
			dlg.appendTo("body");
			dlg[0].showModal();

			let dir = WebDAV.Fs("").dir(this.webDAVdir)
			let progList = [];
			for (const f of await dir.children()) {
				let name = decodeURIComponent(f.name);
				let m = name.match(/^(?<name>.+)\.progress$/i);
				if (m) {
					let prog = await f.read();
					if (prog) {
						progList.push({ filename: m.groups["name"], progress_on_server: prog, progress_local: "" });
					}
				}
			}
			for (let i = 0;i < localStorage.length; i ++) {
				let name = localStorage.key(i);
				let m = name.match(/^.+\.txt$/i);
				if (m) {
					let prog = localStorage.getItem(name);
					if (prog) {
						let bk = progList.find(e => e.filename == name);
						if (bk) {
							bk.progress_local = prog;
						} else {
							progList.push({ filename: name, progress_on_server: "", progress_local: prog });
						}
					}
				}
			}
			progList.sort((a, b) => (a.filename.localeCompare(b.filename, "zh")));
			let container = dlg.find(".progress-list");
			container.html(`<div>书籍文件名</div><div>云端进度</div><div>本地进度</div>`);
			for (const bk of progList) {
				let cls = (bk.progress_on_server == bk.progress_local) ? "eq" : "neq";
				let row = $(`<div class="${cls}">${bk.filename}</div><div class="${cls}" style="text-align:right;">${bk.progress_on_server}</div><div class="${cls}" style="text-align:right;">${bk.progress_local}</div>`);
				container.append(row);
			}
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#progressDlg").remove();
			STReHelper.unfreezeContent();
		}
		return this;
	},

	async enable() {
		if (!this.enabled) {
			fileloadCallback.regAfter(this.loadProgress);
			$(`<div id="STRe-POS-btn" class="btn-icon">
				<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path stroke="none" d="M13.5 20c.31.75.76 1.42 1.32 2H6c-1.11 0-2-.89-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7.03c-.16-.03-.33-.03-.5-.03c-.5 0-1 .07-1.5.18V4h-5v8l-2.5-2.25L8 12V4H6v16h7.5m5.5 0a2.5 2.5 0 0 1-2.5-2.5c0-.4.09-.78.26-1.12l-1.09-1.09c-.42.63-.67 1.39-.67 2.21c0 2.21 1.79 4 4 4V23l2.25-2.25L19 18.5V20m0-6.5V12l-2.25 2.25L19 16.5V15a2.5 2.5 0 0 1 2.5 2.5c0 .4-.09.78-.26 1.12l1.09 1.09c.42-.63.67-1.39.67-2.21c0-2.21-1.79-4-4-4Z"/>
				</svg></div>`).click(() => this.show()).prependTo($("#btnWrapper"));
			this.enabled = true;
			console.log("Module <Progress on Server> enabled.");
			if (this.syncInterval > 0) {
				this.syncOnFileLoad = true;
				setTimeout(() => this.loop(), this.syncInterval * 1000);
				console.log("Module <Progress on Server> - <Auto Sync> enabled.");
			} else {
				this.syncOnFileLoad = false;
				setTimeout(() => this.loop(), 1000);
				console.log("Module <Progress on Server> - <Auto Sync> not enabled.");
			}
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			fileloadCallback.unregAfter(this.loadProgress);
			$("#STRe-POS-btn").remove();
			this.enabled = false;
			console.log("Module <Progress on Server> disabled.");
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
					console.log("Reopen file on start: " + fname);
					await STRe_Bookshelf.openFile(fname);
				}
			}
		}
	},

	async openFile(fname) {
		if (this.enabled) {
			console.log("Open file from cache: " + fname);
			showLoadingScreen();
			try {
				let book = await this.db.getBook(fname);
				if (book) {
					book.name = fname;
					resetVars();
					handleSelectedFile([book]);
					return true;
				} else {
					alert("发生错误！");
					throw new Error("openFile error! " + fname);
				}
			} catch (e) {
				console.log(e);
				return false;
			}
		}
	},

	async saveFile(file) {
		if (STRe_Bookshelf.enabled) {
			if (file.type === "text/plain") {
				console.log("saveFile: ", file.name);
				// 先把文件保存到缓存db中
				await STRe_Bookshelf.db.putBook(file.name, file);
				// 刷新 Bookshelf in DropZone
				await STRe_Bookshelf.freshBookList();
			}
		}
		return file;
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
		let book = $(`<div class="book property" data-filename="${name}">
			<div style="height:1.5rem;line-height:1.5rem;"><span class="delete-btn" title="删除">&times;</span></div>
			<div class="cover">${name}</div>
			<div class="progress"></div></div>`);
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
		if (progress) {
			let m = progress.match(/^(?<line>\d+)\/(?<total>\d+)?$/i);
			if (m) {
				pct = (eval(progress) * 100).toFixed(1) + "%";
				book.addClass("read").css("--read-progress", pct);
			}
			// book.attr("title", "阅读进度："+pct+" ("+progress+")");
			book.find(".progress").html("进度：" + pct).attr("title", progress);
		} else {
			// book.attr("title", "阅读进度：无");
			book.find(".progress").html("进度：无");
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
		// // 替换 handleSelectedFile 函数
		// function handleSelectedFile__hack(fileList) {
		// 	if (fileList.length > 0 && fileList[0].type === "text/plain") {
		// 		// 先把文件保存到缓存db中
		// 		STRe_Bookshelf.saveFile(fileList[0])
		// 			.then(() => {
		// 				// 刷新 Bookshelf in DropZone
		// 				STRe_Bookshelf.freshBookList();
		// 			})
		// 			.finally(() => {
		// 				handSelectedFile__ORIGIN(fileList);
		// 			});
		// 	}
		// }

		if (!this.enabled) {
			this.db = new STReLocalDB();
			// STReHelper.replaceFunc(window, "handleSelectedFile", "handSelectedFile__ORIGIN", handleSelectedFile__hack);
			fileloadCallback.regBefore(this.saveFile);
			$(`<div id="STRe-bookshelf-btn" class="btn-icon">
				<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path stroke="none" d="M9 3v15h3V3H9m3 2l4 13l3-1l-4-13l-3 1M5 5v13h3V5H5M3 19v2h18v-2H3Z"/>
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
			// STReHelper.replaceFunc(window, "handleSelectedFile", "abandonFunc__STRe_Bookshelf", handSelectedFile__ORIGIN);
			fileloadCallback.unregBefore(this.saveFile);
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
// STReHelper.setCSS(":root", "font-size", (16*DPR)+"px");