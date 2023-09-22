let STRe_PROGRESS_FN_RE = /^(?<name>.+)\.progress$/i; // 格式：filename.progress
let STRe_PROGRESS_RE = /^(?<line>\d+)(\/(?<total>\d+))?$/i; // 格式：line/total，match() 的结果：[full, line, /total, total]

var STReHelper = {
	// // hack helper
	// FUNC_RE: /^\s*(function)?\s*(?<name>\w*)\s*\((?<args>[^\)]*)\)[\s\r\n]*{(?<body>.*)}\s*$/si, // function F(a) {b}
	// // FUNC_RE2: /^\s*\((?<args>[^\)]*)\)[\s\r\n]*=>[\s\r\n]*{?(?<body>.*)}?\s*$/is, // (a) => {b}
	// getFuncArgs(func) {
	// 	let r = this.FUNC_RE.exec(func.toString()); // || this.FUNC_RE2.exec(func.toString());
	// 	return r ? r.groups["args"] : "";
	// },
	// getFuncBody(func) {
	// 	let r = this.FUNC_RE.exec(func.toString()); // || this.FUNC_RE2.exec(func.toString());
	// 	return r ? r.groups["body"] : "";
	// },
	// replaceFunc(funcOwner, funcName, funcCopyName, newFunc) {
	// 	try {
	// 		funcOwner[funcCopyName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(funcOwner[funcName]));
	// 		funcOwner[funcName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(newFunc));
	// 	} catch (e) {
	// 		console.log("replaceFunc() args:", this.getFuncArgs(funcOwner[funcName]));
	// 		console.log("replaceFunc() old body:", this.getFuncBody(funcOwner[funcName]));
	// 		console.log("replaceFunc() new body:", this.getFuncBody(newFunc));
	// 		throw e;
	// 	}
	// },

	isElmVisible(elm, pseudoElt = null) {
		let styles = window.getComputedStyle(elm, pseudoElt);
		return (styles["display"] != "none") && (styles["visibility"] != "hidden") && (styles["visibility"] != "collapse");
	},

	async fetchLink(link) {
		let args = {};
		// args.headers = { "If-Modified-Since": "0" };
		try {
			if ((typeof browser == "undefined") &&
				(typeof chrome == "undefined" || typeof chrome.extension == "undefined")) {
				// 正常网页模式下 include credentials，这样可以访问一些需要登录的 WebDAV
				// 浏览器扩展模式下，暂时不支持凭据
				args.credentials = "include";
			}
		} catch (e) {
			console.log(e);
		}
		// console.log("fetch args:", args);
		let resp = await fetch(link, args);
		if (!resp.ok) throw new Error(`Fetch link <${link}> error! RESP: ${resp.status} ${resp.statusText}`);
		return resp;
	},

	getLocalProgress(fn) {
		return localStorage.getItem(fn + ".progress");
	},
	setLocalProgress(fn, prog) {
		return localStorage.setItem(fn + ".progress", prog);
	},
	getLocalProgressAll() {
		let ret = [];
		for (let i = 0; i < localStorage.length; i++) {
			let m = localStorage.key(i).match(STRe_PROGRESS_FN_RE);
			if (m) {
				ret.push({ name: m.groups["name"], progress: this.getLocalProgress(m.groups["name"]) });
			}
		}
		return ret;
	},
};


// ------------------------------------------------
// Module <Files on Server>
// ------------------------------------------------
class SettingGroupFoS extends SettingGroupBase {
	constructor() {
		super("FoS", "云端书库");
		this.add(new SettingCheckbox("enable", "启用", false));
		this.add(new SettingText("WebDAV", "WebDAV 地址", "/books"));
	}

	genHTML() {
		let sts = this.settings;
		let html = `<div id="${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>
            <div class="setting-group-settings">
            <div class="row">${sts["enable"].genInputElm()} ${sts["enable"].genLabelElm()}</div>
            ${sts["WebDAV"].genLabelElm()} ${sts["WebDAV"].genInputElm()}
            </div></div>`;
		return html;
	}

	apply() {
		STRe_FilesOnServer.webDAVdir = this.get("WebDAV").value.trimEnd().replace(/\/*$/, "");
		if (this.get("enable").value) {
			STRe_FilesOnServer.enable();
		} else {
			STRe_FilesOnServer.disable();
		}
		return this;
	}
}

var STRe_FilesOnServer = {

	enabled: false,
	webDAVdir: "", // http://WebDAV/books

	openFile(file) {
		// console.log("STRe_FilesOnServer.openFile: " + fname);
		showLoadingScreen();
		STReHelper.fetchLink(file.url).then((resp) => {
			resp.blob().then((blob) => {
				if (blob.type.startsWith("text/plain")) { // firefox type: "text/plain; charset=UTF-8"
					let f = new File([blob], file.name, { type: "text/plain" });
					resetVars();
					handleSelectedFile([f]);
				} else {
					console.log(`Unsupported file type: ${file.name} (${blob.type})`);
					alert("文件格式不支持");
					resetUI();
				}
			});
		}).catch((e) => {
			console.log("", e);
			alert("打开云端书籍出错");
			resetUI();
		});
	},

	async lsDir(url, level = 0) {
		$("#serverDir").html("🪐 " + decodeURI(url));
		let dir = WebDAV.Fs("").dir(url);
		let container = $("#serverFilesDlg").find(".dlg-body");
		let dir_list = [];
		let file_list = [];
		try {
			// for (const f of fs.dir("/books").children()) {
			for (const c of await dir.children()) {
				c.name = decodeURIComponent(c.name);
				if (c.type == "file") {
					if (c.name.toLowerCase().endsWith(".txt"))
						file_list.push(c);
				} else if (c.type == "dir") {
					dir_list.push(c);
				}
			}
		} catch (e) {
			console.log(e);
			container.html(`<div>获取云端书籍列表发生错误！</div><div>WebDAV 地址：${dir.url}</div><div>错误信息：${e.message}</div>`);
			return;
		}
		dir_list.sort((a, b) => (a.name.localeCompare(b.name, "zh")));
		file_list.sort((a, b) => (a.name.localeCompare(b.name, "zh"))); // 拼音序
		container.html("");
		if (level) {
			let m = dir.url.match(/^(?<up>.+)\/[^\/]+$/);
			if (m) {
				$(`<div class="item up-level" data-filename="">⬆ UP LEVEL ⬆</div>`).click(() => {
					this.lsDir(m.groups["up"], level - 1);
				}).appendTo(container);
			}
		}
		for (const d of dir_list) {
			$(`<div class="item dir" data-filename="${d.name}">📁 ${d.name}</div>`).click(() => {
				this.lsDir(d.url, level + 1);
			}).appendTo(container);
		}
		for (const f of file_list) {
			let bookElm = $(`<div class="item book" data-filename="${f.name}">📓 ${f.name}</div>`).click(() => {
				this.hide();
				this.openFile(f);
			}).appendTo(container);
			let progress = STReHelper.getLocalProgress(f.name);
			if (progress) {
				let pct = "?%";
				let m = STRe_PROGRESS_RE.exec(progress);
				if (m && m.groups["total"]) {
					pct = ((m.groups["line"] / m.groups["total"]) * 100).toFixed(1) + "%";
				}
				bookElm.addClass("read").css("--read-progress", pct);
				bookElm.attr("title", `进度：${pct} (${progress})`);
			}
		}
	},

	async show() {
		if (this.enabled) {
			let dlg = $(`<dialog id="serverFilesDlg" class="files-on-server-dlg">
				<div class="dlg-cap">云端书库
					<div class="cur-dir" id="serverDir"></div>
				</div>
				<span class="dlg-body">
					<img src="./images/loading_geometry.gif" style="display:block;width:30vw;filter:var(--mainColor_filter); "/>
				</span>
				</dialog>`).bind("cancel", () => this.hide());
			dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
			freezeContent();
			// document.getElementById("serverFilesDlg").showModal();
			dlg.appendTo("body");
			dlg[0].showModal();
			setEscapeFunc(() => STRe_FilesOnServer.hide());

			await this.lsDir(this.webDAVdir);
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$('#serverFilesDlg').remove();
			unfreezeContent();
			setEscapeFunc(null);
		}
		return this;
	},

	async enable() {
		if (!this.enabled) {
			$("#STRe-FOS-btn").show();
			this.enabled = true;
			console.log("Module <Files on Server> enabled.");
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			this.hide();
			$("#STRe-FOS-btn").hide();
			this.enabled = false;
			console.log("Module <Files on Server> disabled.");
		}
		return this;
	},

	init() {
		$(`<div id="STRe-FOS-btn" class="btn-icon">
		<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path stroke="none" d="M15 15H9v-1h6v1m0 1H9v1h6v-1m0 2H9v1h6v-1m8-4.5c0 1.25-.44 2.31-1.31 3.19c-.88.87-1.94 1.31-3.19 1.31H18v4H6v-4.05c-1.3-.1-2.43-.59-3.39-1.52C1.54 15.38 1 14.09 1 12.58c0-1.3.39-2.46 1.17-3.48S4 7.43 5.25 7.15c.42-1.53 1.25-2.77 2.5-3.72S10.42 2 12 2c1.95 0 3.6.68 4.96 2.04C18.32 5.4 19 7.05 19 9c1.15.13 2.1.63 2.86 1.5c.76.85 1.14 1.85 1.14 3M6 15.95V11h11V9c0-1.38-.5-2.56-1.46-3.54C14.56 4.5 13.38 4 12 4s-2.56.5-3.54 1.46C7.5 6.44 7 7.62 7 9h-.5c-.97 0-1.79.34-2.47 1.03c-.69.68-1.03 1.5-1.03 2.47s.34 1.79 1.03 2.5c.56.54 1.22.85 1.97.95M16 13H8v7h8v-7m5 .5c0-.7-.24-1.29-.73-1.77S19.2 11 18.5 11H18v5h.5c.7 0 1.29-.24 1.77-.72S21 14.2 21 13.5Z"/>
		</svg></div>`)
			.click(() => this.show())
			.prependTo($("#btnWrapper"))
			.hide();

		settingMgr.add(new SettingGroupFoS());
	},
};

// ------------------------------------------------
// Module <Progress on Server>
// ------------------------------------------------
class SettingGroupPoS extends SettingGroupBase {
	constructor() {
		super("PoS", "云端进度");
		this.add(new SettingCheckbox("enable", "启用", false));
		this.add(new SettingText("WebDAV", "WebDAV 地址", "/progress"));
		this.add(new SettingInt("interval", "自动同步间隔", 5));
	}

	genHTML() {
		let html = `<div id="${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>
            <div class="setting-group-settings">
            <div class="row">${this.get("enable").genInputElm()} ${this.get("enable").genLabelElm()}</div>
            ${this.get("WebDAV").genLabelElm()} ${this.get("WebDAV").genInputElm()}
            ${this.get("interval").genLabelElm()} <span>${this.get("interval").genInputElm(`style="width:3rem;"`)}秒（0 表示关闭自动同步）</span>
            </div></div>`;
		return html;
	}

	apply() {
		STRe_ProgressOnServer.webDAVdir = this.get("WebDAV").value.trimEnd().replace(/\/*$/, "");
		STRe_ProgressOnServer.syncInterval = this.get("interval").value;
		if (this.get("enable").value) {
			STRe_ProgressOnServer.enable();
		} else {
			STRe_ProgressOnServer.disable();
		}
		return this;
	}
}

var STRe_ProgressOnServer = {

	enabled: false,
	loopPaused: false,
	syncOnFileLoad: false,

	STReFileLine: "", // filename + ":" + line 记录之前的文件和行数，改变才同步到云端，减少同步次数

	webDAVdir: "", // http://WebDAV/progress
	syncInterval: 1, // 同步间隔（秒）

	async getProgress(name) {
		return await WebDAV.Fs("").file(this.webDAVdir + "/" + name + ".progress").read(true);
	},

	async setProgress(name, progress) {
		return await WebDAV.Fs("").file(this.webDAVdir + "/" + name + ".progress").write(progress);
	},

	async saveProgress() {
		if (!this.enabled) return; // 不开启云端进度
		if (this.loopPaused) return; // 正在等用户决定是否同步
		if (filename) {
			if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
				return;
			}
			let line = getHistory(filename, false); // getCurLineNumber();
			if ((filename + ":" + line) != this.STReFileLine) {
				// console.log("Save progress on server: " + filename + ":" + line + "/" + fileContentChunks.length);
				try {
					await this.setProgress(filename, line + "/" + (fileContentChunks.length - 1));
				} catch (e) {
					console.log(e);
				}
				this.STReFileLine = filename + ":" + line;
			}
		}
	},

	async loadProgress() {
		if (!STRe_ProgressOnServer.enabled) return;
		if (!STRe_ProgressOnServer.syncOnFileLoad) return;
		if (filename) {
			// console.log("Check progress on server: " + filename);
			try {
				let progress = await STRe_ProgressOnServer.getProgress(filename);
				let m = STRe_PROGRESS_RE.exec(progress);
				if (m) { // 取到服务端进度
					let line = parseInt(m.groups["line"]);
					let curLine = getCurLineNumber();
					if (line == curLine) { // 进度一致，无需同步
						STRe_ProgressOnServer.STReFileLine = filename + ":" + line;
					} else { // 进度不一致
						if (confirm(`当前阅读进度：${curLine}/${fileContentChunks.length - 1}\n发现云端进度：${progress}\n是否跳转到云端进度？`)) {
							console.log("Load progress on server: " + filename + ":" + progress);
							setHistory(filename, line);
							getHistory(filename);
							STRe_ProgressOnServer.STReFileLine = filename + ":" + line;
						}
					}
				}
			} catch (e) {
				console.log(e);
			}
		}
	},

	async loop() { // 定时同步进度
		if (this.enabled) {
			if (this.syncInterval > 0) {
				this.syncOnFileLoad = true;
				await this.saveProgress();
				setTimeout(() => this.loop(), this.syncInterval * 1000);
			} else {
				this.syncOnFileLoad = false;
				setTimeout(() => this.loop(), 1000);
			}
		}
	},
	pauseLoop() {
		STRe_ProgressOnServer.loopPaused = true;
		// console.log("PoS loop paused.")
	},
	resumeLoop() {
		STRe_ProgressOnServer.loopPaused = false;
		// console.log("PoS loop resumed.")
	},

	async upload() {
		if (this.enabled) {
			// console.log("Uploading progress.");
			for (p of STReHelper.getLocalProgressAll()) {
				if (STRe_PROGRESS_RE.test(p.progress)) {
					try {
						await this.setProgress(p.name, p.progress);
					} catch (e) {
						console.log(e);
					}
				}
			}
		}
	},

	async download() {
		if (this.enabled) {
			// console.log("Downloading progress.");
			try {
				for (const f of await WebDAV.Fs("").dir(this.webDAVdir).children()) {
					let m = decodeURIComponent(f.name).match(STRe_PROGRESS_FN_RE);
					if (m) {
						let prog = await this.getProgress(m.groups["name"]);
						if (STRe_PROGRESS_RE.test(prog)) {
							STReHelper.setLocalProgress(m.groups["name"], prog); //localStorage.setItem(m.groups["name"], prog);
						}
					}
				}
			} catch (e) {
				console.log(e);
			}
		}
	},

	async refreshProgressList() {
		let progList = [];
		for (const f of await WebDAV.Fs("").dir(this.webDAVdir).children()) {
			let m = decodeURIComponent(f.name).match(STRe_PROGRESS_FN_RE);
			if (m) {
				let m2 = STRe_PROGRESS_RE.exec(await f.read(true));
				if (m2 && m2.groups["line"] != "0") {
					progList.push({ filename: m.groups["name"], progress_on_server: m2[0], progress_local: "-" });
				}
			}
		}
		for (const p of STReHelper.getLocalProgressAll()) {
			if (p.progress.startsWith("0/")) continue;
			let bk = progList.find(e => e.filename == p.name);
			if (bk) {
				bk.progress_local = p.progress;
			} else {
				progList.push({ filename: p.name, progress_on_server: "-", progress_local: p.progress });
			}
		}
		progList.sort((a, b) => (a.filename.localeCompare(b.filename, "zh")));
		let container = $("#progressDlg .progress-list");
		container.html(`<div>书籍文件名</div><div style="text-align:right;">云端进度</div><div style="text-align:right;">本地进度</div>`);
		for (const bk of progList) {
			let cls = (bk.progress_on_server == bk.progress_local) ? "eq" : "neq";
			let row = $(`<div class="prog-name ${cls}">${bk.filename}</div><div class="prog-server ${cls}">${bk.progress_on_server}</div><div class="prog-local ${cls}">${bk.progress_local}</div>`);
			container.append(row);
		}
	},

	async show() {
		if (this.enabled) {
			let dlg = $(`<dialog id="progressDlg">
				<div class="dlg-cap">手动同步进度</div>
				<span class="dlg-body progress-list">
				</span>
				<div class="dlg-foot"></div>
				</dialog>`).bind("cancel", () => this.hide());
			dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
			dlg.find(`.dlg-foot`)
				.append($(`<input type="checkbox" id="progressDlgChk" />`)
					.change(evt => { evt.currentTarget.checked ? $("#progressDlg .eq").show() : $("#progressDlg .eq").hide(); }))
				.append(`<label for="progressDlgChk">显示进度一致的书籍</label>`)
				.append($(`<span style="float:right"></span>`)
					.append(`<span>云端&nbsp;</span>`)
					.append($(`<button> ⇦ </button>`).click(async () => { await this.upload(); this.refreshProgressList(); }))
					.append(" ")
					.append($(`<button> ⇨ </button>`).click(async () => { await this.download(); this.refreshProgressList(); STRe_Bookshelf.refreshBookList(); }))
					.append(`<span>&nbsp;本地</span>`)
				);// ＜⇦←⇠◀◁   →⇢＞⇨▶▷
			freezeContent();
			dlg.appendTo("body");
			dlg[0].showModal();
			setEscapeFunc(() => STRe_ProgressOnServer.hide());
			await this.refreshProgressList();
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#progressDlg").remove();
			unfreezeContent();
			setEscapeFunc(null);
		}
		return this;
	},

	async enable() {
		if (!this.enabled) {
			$("#STRe-POS-btn").show();
			fileloadCallback.regBefore(this.pauseLoop);
			fileloadCallback.regAfter(this.loadProgress);
			fileloadCallback.regAfter(this.resumeLoop);
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
			$("#STRe-POS-btn").hide();
			fileloadCallback.unregBefore(this.pauseLoop);
			fileloadCallback.unregAfter(this.loadProgress);
			fileloadCallback.unregAfter(this.resumeLoop);
			this.enabled = false;
			console.log("Module <Progress on Server> disabled.");
		}
		return this;
	},

	init() {
		$(`<div id="STRe-POS-btn" class="btn-icon">
		<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path stroke="none" d="M13.5 20c.31.75.76 1.42 1.32 2H6c-1.11 0-2-.89-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7.03c-.16-.03-.33-.03-.5-.03c-.5 0-1 .07-1.5.18V4h-5v8l-2.5-2.25L8 12V4H6v16h7.5m5.5 0a2.5 2.5 0 0 1-2.5-2.5c0-.4.09-.78.26-1.12l-1.09-1.09c-.42.63-.67 1.39-.67 2.21c0 2.21 1.79 4 4 4V23l2.25-2.25L19 18.5V20m0-6.5V12l-2.25 2.25L19 16.5V15a2.5 2.5 0 0 1 2.5 2.5c0 .4-.09.78-.26 1.12l1.09 1.09c.42-.63.67-1.39.67-2.21c0-2.21-1.79-4-4-4Z"/>
		</svg></div>`)
			.click(() => this.show())
			.prependTo($("#btnWrapper"))
			.hide();

		settingMgr.add(new SettingGroupPoS());
	},
};


// ------------------------------------------------
// Module <Bookshelf>
// ------------------------------------------------
class SettingGroupBookshelf extends SettingGroupBase {
	constructor() {
		super("bookshelf", "缓存书架");
		this.add(new SettingCheckbox("enable", "启用", true));
		this.add(new SettingCheckbox("reopen", "启动时打开上次阅读书籍", true));
	}

	genHTML() {
		let html = `<div id="setting-group-${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>
            <div class="setting-group-settings">
            <div>${this.get("enable").genInputElm()} ${this.get("enable").genLabelElm()}</div>
            <div>${this.get("reopen").genInputElm()} ${this.get("reopen").genLabelElm()}</div>
            </div></div>`;
		return html;
	}

	apply() {
		STRe_Bookshelf.reopenEnabled = this.get("reopen").value;
		if (this.get("enable").value) {
			STRe_Bookshelf.enable();
		} else {
			STRe_Bookshelf.disable();
		}
		return this;
	}

}

var STRe_Bookshelf = {

	enabled: false,
	reopenEnabled : false,
	db: null,

	STRe_FILENAME: "STRe-Filename",
	STRe_CACHE_FLAG: "STRe-Cache-File",

	async reopenBook() {
		if (this.enabled && this.reopenEnabled) {
			// 获取之前的文件名，重新打开
			let fname = localStorage.getItem(this.STRe_FILENAME);
			if (fname) {
				if (await STRe_Bookshelf.isBookExist(fname)) {
					console.log("Reopen book on start: " + fname);
					await STRe_Bookshelf.openBook(fname);
				}
			}
		}
	},

	async openBook(fname) {
		if (this.enabled) {
			// console.log("Open file from cache: " + fname);
			showLoadingScreen();
			try {
				let book = await this.db.getBook(fname);
				if (book) {
					book[this.STRe_CACHE_FLAG] = true;
					resetVars();
					handleSelectedFile([book]);
					return true;
				} else {
					alert("发生错误！");
					throw new Error("openBook error! " + fname);
				}
			} catch (e) {
				console.log(e);
				return false;
			}
		}
	},

	async saveBook(file, refreshBookshelf = true) {
		if (STRe_Bookshelf.enabled) {
			if (file.type === "text/plain") {
				if (file[STRe_Bookshelf.STRe_CACHE_FLAG]) {
					// console.log("Openning cache-book, so not save.");
				} else {
					console.log("saveBook: ", file.name);
					// 先把文件保存到缓存db中
					await STRe_Bookshelf.db.putBook(file.name, file);
					if (!await STRe_Bookshelf.db.isBookExist(file.name))
						alert("保存到本地书架失败（缓存空间可能已满）");
					// 刷新 Bookshelf in DropZone
					if (refreshBookshelf)
						await STRe_Bookshelf.refreshBookList();
				}
			}
		}
		return file;
	},

	async isBookExist(fname) {
		if (this.enabled) {
			return await this.db.isBookExist(fname);
		} else {
			return false;
		}
	},

	async deleteBook(fname, onSucc = null) {
		if (this.enabled) {
			this.db.deleteBook(fname).then(() => {
				if (onSucc) onSucc();
			});
		}
	},

	// 更新书籍阅读进度
	updateBookProgressInfo(fname, bookElm = null) {
		if (!bookElm) {
			bookElm = $(`.bookshelf .book[data-filename="${fname}"]`);
			if (bookElm.length <= 0) {
				return;
			}
		}
		let progress = STReHelper.getLocalProgress(fname);
		if (progress) {
			let pct = "?%";
			let m = STRe_PROGRESS_RE.exec(progress);
			if (m && m.groups["total"]) {
				pct = ((m.groups["line"] / m.groups["total"]) * 100).toFixed(1) + "%";
			}
			bookElm.addClass("read").css("--read-progress", pct);
			bookElm.find(".progress").html(pct).attr("title", progress);
		} else {
			bookElm.removeClass("read").css("--read-progress", "");
			bookElm.find(".progress").html("&nbsp;");
		}
	},

	genBookItem(bookInfo) {
		let book = $(`<div class="book" data-filename="${bookInfo.name}">
			<div class="btn-bar"><span class="delete-btn" title="删除">&times;</span></div>
			<div class="cover">${bookInfo.name}</div>
			<div>
			<div class="size">${(bookInfo.size/1000/1000).toFixed(2)} MB</div>
			<div class="progress"></div></div></div>`);
		book.find(".cover").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.openBook(bookInfo.name);
		});
		book.find(".delete-btn").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.deleteBook(bookInfo.name, () => {
				// this.refreshBookList()
				let b = $(evt.currentTarget).parents(".book");
				// b.fadeOut(500, () => b.remove());
				b.animate({width: 0, opacity: 0}, 500, () => b.remove());
			});
		});
		this.updateBookProgressInfo(bookInfo.name, book);
		return book;
	},

	async refreshBookList() {
		if (this.enabled) {
			let container = $(".bookshelf .book-list");
			container.html("");
			let storageInfo = await navigator.storage.estimate();
			if (storageInfo) {
				$("#bookshelfUsagePct").html((storageInfo.usage / storageInfo.quota * 100).toFixed(1));
				$("#bookshelfUsage").html((storageInfo.usage / 1000 / 1000).toFixed(2));
				$("#bookshelfQuota").html((storageInfo.quota / 1000 / 1000).toFixed(2));
			}
			let booklist = [];
			try {
				for (const book of await this.db.getAllBooks()) {
					booklist.push({name: book.name, size: book.data.size});
				}
				booklist.sort((a, b) => (a.name.localeCompare(b.name, "zh")));
				for (const bookInfo of booklist) {
					container.append(this.genBookItem(bookInfo));
				}
			} catch (e) {
				console.log(e);
			}
		}
	},

	async show() {
		if (this.enabled) {
			$(`<div class="bookshelf">
			<div class="title">缓存书架
				<div class="sub-title">【提示】书籍保存在浏览器缓存空间内，可能会被系统自动清除。<br />
				已用空间：<span id="bookshelfUsagePct"></span>% (<span id="bookshelfUsage"></span> MB / <span id="bookshelfQuota"></span> MB)</div>
			</div>
			<span class="book-list"></span>
			</div>`).appendTo("#dropZone");
			this.refreshBookList();
		}
		return this;
	},

	loop() {
		if (this.enabled) {
			localStorage.setItem(this.STRe_FILENAME, filename);
			if (filename) this.updateBookProgressInfo(filename);
			setTimeout(() => this.loop(), 1000);
		}
	},

	enable() {
		if (!this.enabled) {
			this.db = new STReLocalDB();
			fileloadCallback.regBefore(this.saveBook);
			// $("#STRe-bookshelf-btn").show();
			this.enabled = true;
			this.show();
			console.log("Module <Bookshelf> enabled.");
			setTimeout(() => this.loop(), 1000);
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			fileloadCallback.unregBefore(this.saveBook);
			$(".bookshelf").remove();
			// $("#STRe-bookshelf-btn").hide();
			this.db = null;
			this.enabled = false;
			console.log("Module <Bookshelf> disabled.");
		}
		return this;
	},

	init() {
		// $(`<div id="STRe-bookshelf-btn" class="btn-icon">
		// <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		// 	<path stroke="none" d="M9 3v15h3V3H9m3 2l4 13l3-1l-4-13l-3 1M5 5v13h3V5H5M3 19v2h18v-2H3Z"/>
		// </svg></div>`)
		// 	.click(() => { resetUI(); })
		// 	.prependTo($("#btnWrapper"))
		// 	.hide();

		settingMgr.add(new SettingGroupBookshelf());
	},
};

STRe_Bookshelf.init();
STRe_ProgressOnServer.init();
STRe_FilesOnServer.init();

// 启动时打开上次阅读书籍
STRe_Bookshelf.reopenBook();
