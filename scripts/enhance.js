let STRe_PROGRESS_FN_RE = /^(?<name>.+)\.progress$/i; // 格式：filename.progress
let STRe_PROGRESS_RE = /^(?<line>\d+)(\/(?<total>\d+))?$/i; // 格式：line/total，match() 的结果：[full, line, /total, total]

let DPR = window.devicePixelRatio;

var STReHelper = {
	// hack helper
	FUNC_RE: /^\s*(function)?\s*(?<name>\w*)\s*\((?<args>[^\)]*)\)[\s\r\n]*{(?<body>.*)}\s*$/si, // function F(a) {b}
	// FUNC_RE2: /^\s*\((?<args>[^\)]*)\)[\s\r\n]*=>[\s\r\n]*{?(?<body>.*)}?\s*$/is, // (a) => {b}
	getFuncArgs(func) {
		let r = this.FUNC_RE.exec(func.toString()); // || this.FUNC_RE2.exec(func.toString());
		return r ? r.groups["args"] : "";
	},
	getFuncBody(func) {
		let r = this.FUNC_RE.exec(func.toString()); // || this.FUNC_RE2.exec(func.toString());
		return r ? r.groups["body"] : "";
	},
	replaceFunc(funcOwner, funcName, funcCopyName, newFunc) {
		try {
			funcOwner[funcCopyName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(funcOwner[funcName]));
			funcOwner[funcName] = new Function(this.getFuncArgs(funcOwner[funcName]), this.getFuncBody(newFunc));
		} catch (e) {
			console.log(this.getFuncArgs(funcOwner[funcName]));
			console.log(this.getFuncBody(funcOwner[funcName]));
			console.log(this.getFuncBody(newFunc));
			throw e;
		}
	},

	isElmVisible(elm, pseudoElt = null) {
		let styles = window.getComputedStyle(elm, pseudoElt);
		return (styles["display"] != "none") && (styles["visibility"] != "hidden") && (styles["visibility"] != "collapse");
	},

	async fetchLink(link) {
		let resp = await fetch(link, {
			credentials: "include",
		});
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
// Module <Files on Server>
// ------------------------------------------------
class SettingGroupFoS extends SettingGroupBase {
	constructor() {
		super("setting-group-FoS", "云端书库");
		this.settings["enable"] = new SettingCheckbox(this.id + "-enable", "启用", false);
		this.settings["WebDAV"] = new SettingText(this.id + "-WebDAV", "WebDAV 地址", "/books");
	}

	genHTML() {
		let sts = this.settings;
		let html = `<div class="sub-cap">${this.desc}</div>
            <div class="setting-group setting-group-fos">
            <div class="row">${sts["enable"].genInputElm()} ${sts["enable"].genLabelElm()}</div>
            ${sts["WebDAV"].genLabelElm()} ${sts["WebDAV"].genInputElm()}
            </div>`;
		return html;
	}

	apply() {
		STRe_FilesOnServer.webDAVdir = this.settings["WebDAV"].value.trimEnd().replace(/\/*$/, "");
		if (this.settings["enable"].value) {
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

	openFile(fname) {
		console.log("STRe_FilesOnServer.openFile: " + fname);
		showLoadingScreen();
		STReHelper.fetchLink(this.webDAVdir + "/" + fname).then((resp) => {
			resp.blob().then((blob) => {
				if (blob.type.startsWith("text/plain")) { // firefox type: "text/plain; charset=UTF-8"
					let f = new File([blob], fname, { type: "text/plain" });
					resetVars();
					handleSelectedFile([f]);
				} else {
					console.log(`Unsupported file type: ${fname} (${blob.type})`);
					alert("文件格式不支持");
					hideLoadingScreen();
				}
			});
		}).catch((e) => {
			console.log("", e);
			alert("打开云端书籍出错");
			hideLoadingScreen();
		});
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
			freezeContent();
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
					// if (fname.toLowerCase().endsWith(".txt"))
					fname_list.push(fname);
				}
			} catch (e) {
				console.log(e);
				dlg.find(".dlg-body").html(`<div>获取云端书籍列表发生错误！</div><div>WebDAV 地址：${this.webDAVdir}</div><div>错误信息：${e.message}</div>`);
				return this;
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
				let progress = STReHelper.getLocalProgress(fn); //localStorage.getItem(fn);
				let pct = "?%";
				if (progress) {
					if (STRe_PROGRESS_RE.test(progress)) {
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
			unfreezeContent();
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

		settingMgr.groups["FoS"] = new SettingGroupFoS();
		settingMgr.load("FoS").apply("FoS");
	},
};

// ------------------------------------------------
// Module <Progress on Server>
// ------------------------------------------------
class SettingGroupPoS extends SettingGroupBase {
	constructor() {
		super("setting-group-PoS", "云端进度");
		this.settings["enable"] = new SettingCheckbox(this.id + "-enable", "启用", false);
		this.settings["WebDAV"] = new SettingText(this.id + "-WebDAV", "WebDAV 地址", "/progress");
		this.settings["interval"] = new SettingInt(this.id + "-interval", "自动同步间隔", 5);
	}

	genHTML() {
		let sts = this.settings;
		let html = `<div class="sub-cap">${this.desc}</div>
            <div class="setting-group setting-group-pos">
            <div class="row">${sts["enable"].genInputElm()} ${sts["enable"].genLabelElm()}</div>
            ${sts["WebDAV"].genLabelElm()} ${sts["WebDAV"].genInputElm()}
            ${sts["interval"].genLabelElm()} <span>${sts["interval"].genInputElm(`style="width:3rem;"`)}秒（0 表示关闭自动同步）</span>
            </div>`;
		return html;
	}

	apply() {
		STRe_ProgressOnServer.webDAVdir = this.settings["WebDAV"].value.trimEnd().replace(/\/*$/, "");
		STRe_ProgressOnServer.syncInterval = this.settings["interval"].value;
		if (this.settings["enable"].value) {
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
			let line = getTopLineNumber(filename);
			if ((filename + ":" + line) != this.STReFileLine) {
				console.log("Save progress on server: " + filename + ":" + line + "/" + fileContentChunks.length);
				try {
					await this.setProgress(filename, line + "/" + fileContentChunks.length);
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
			console.log("Check progress on server: " + filename);
			try {
				let progress = await STRe_ProgressOnServer.getProgress(filename);
				let m = STRe_PROGRESS_RE.exec(progress);
				if (m) { // 取到服务端进度
					let line = parseInt(m.groups["line"]);
					let curLine = getTopLineNumber();
					if (line == curLine) { // 进度一致，无需同步
						STRe_ProgressOnServer.STReFileLine = filename + ":" + line;
					} else { // 进度不一致
						if (confirm(`当前阅读进度：${curLine}/${fileContentChunks.length}\n发现云端进度：${progress}\n是否跳转到云端进度？`)) {
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
			console.log("Uploading progress.");
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
			console.log("Downloading progress.");
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
			await this.refreshProgressList();
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#progressDlg").remove();
			unfreezeContent();
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

		settingMgr.groups["PoS"] = new SettingGroupPoS();
		settingMgr.load("PoS").apply("PoS");
	},
};


// ------------------------------------------------
// Module <Bookshelf>
// ------------------------------------------------
class SettingGroupBookshelf extends SettingGroupBase {
	constructor() {
		super("setting-group-Bookshelf", "缓存书架");
		this.settings["enable"] = new SettingCheckbox(this.id + "-enable", "启用", true);
		this.settings["reopen"] = new SettingCheckbox(this.id + "-reopen", "启动时打开上次阅读书籍", true);
	}

	genHTML() {
		let sts = this.settings;
		let html = `<div class="sub-cap">${this.desc}</div>
            <div class="setting-group setting-group-bookshelf">
            <div class="row">${sts["enable"].genInputElm()} ${sts["enable"].genLabelElm()}</div>
            <div class="row">${sts["reopen"].genInputElm()} ${sts["reopen"].genLabelElm()}</div>
            </div>`;
		return html;
	}

	apply() {
		if (this.settings["enable"].value) {
			STRe_Bookshelf.enable();
		} else {
			STRe_Bookshelf.disable();
		}
		return this;
	}

}

var STRe_Bookshelf = {

	enabled: false,
	db: null,

	STRe_FILENAME: "STRe-Filename",
	STRe_CACHE_FLAG: "STRe-Cache-File",

	async reopenBook() {
		if (this.enabled) {
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
			console.log("Open file from cache: " + fname);
			showLoadingScreen();
			try {
				let book = await this.db.getBook(fname);
				if (book) {
					book.name = fname;
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

	async saveBook(file) {
		if (STRe_Bookshelf.enabled) {
			if (file.type === "text/plain") {
				if (file[STRe_Bookshelf.STRe_CACHE_FLAG]) {
					console.log("Openning cache-book, so not save.");
				} else {
					console.log("saveBook: ", file.name);
					// 先把文件保存到缓存db中
					await STRe_Bookshelf.db.putBook(file.name, file);
					if (!await bookshelf.db.isBookExist(file.name))
						alert("保存到本地书架失败（缓存空间可能已满）");
					// 刷新 Bookshelf in DropZone
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

	genBookItem(bookInfo) {
		let book = $(`<div class="book" data-filename="${bookInfo.name}">
			<div style="height:1.5rem;line-height:1.5rem;"><span class="delete-btn" title="删除">&times;</span></div>
			<div class="cover">
				<div>${bookInfo.name}</div>
				<div class="size">${(bookInfo.size/1000/1000).toFixed(2)} MB</div>
			</div>
			<div class="progress"></div></div>`);
		book.find(".cover").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.hide();
			this.openBook(bookInfo.name);
		});
		book.find(".delete-btn").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.deleteBook(bookInfo.name, () => this.refreshBookList());
		});
		let progress = STReHelper.getLocalProgress(bookInfo.name); //localStorage.getItem(name);
		let pct = "?%";
		if (progress) {
			if (STRe_PROGRESS_RE.test(progress)) {
				pct = (eval(progress) * 100).toFixed(1) + "%";
				book.addClass("read").css("--read-progress", pct);
			}
			book.find(".progress").html("进度：" + pct).attr("title", progress);
		} else {
			book.find(".progress").html("进度：无");
		}
		return book;
	},

	async refreshBookList() {
		if (this.enabled) {
			let container = $(".bookshelf .dlg-body");
			container.html("");
			let storageInfo = await navigator.storage.estimate();
			if (storageInfo) container.append(`<div class="sub-title">【提示】书籍保存在浏览器缓存空间内，可能会被系统自动清除。<br/>
                已用空间：${(storageInfo.usage / storageInfo.quota * 100).toFixed(1)}% (${(storageInfo.usage / 1000 / 1000).toFixed(2)} MB / ${(storageInfo.quota / 1000 / 1000).toFixed(2)} MB)<div>`);
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
			<div class="dlg-cap">缓存书架</div>
			<span class="dlg-body"></span>
			</div>`).appendTo("#dropZone");
			this.refreshBookList();
		}
		return this;
	},

	hide() {
		if (this.enabled) {
			$("#bookshelfDlg").remove();
			unfreezeContent();
		}
		return this;
	},

	loop() {
		if (this.enabled) {
			localStorage.setItem(this.STRe_FILENAME, filename);
			setTimeout(() => this.loop(), 1000);
		}
	},

	enable() {
		if (!this.enabled) {
			this.db = new STReLocalDB();
			fileloadCallback.regBefore(this.saveBook);
			STReHelper.replaceFunc(window, "resetUI", "resetUI__STReBookshelf_bak", function () {
				STRe_Bookshelf.refreshBookList();
				resetUI__STReBookshelf_bak();
			});
			$("#STRe-bookshelf-btn").show();
			this.enabled = true;
			this.show(true);
			console.log("Module <Bookshelf> enabled.");
			setTimeout(() => this.loop(), 1000);
		}
		return this;
	},

	disable() {
		if (this.enabled) {
			STReHelper.replaceFunc(window, "resetUI", "resetUI__STReBookshelf_abandon", resetUI__STReBookshelf_bak);
			fileloadCallback.unregBefore(this.saveBook);
			$(".bookshelf").remove();
			$("#STRe-bookshelf-btn").hide();
			this.db = null;
			this.enabled = false;
			console.log("Module <Bookshelf> disabled.");
		}
		return this;
	},

	init() {
		$(`<div id="STRe-bookshelf-btn" class="btn-icon">
		<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path stroke="none" d="M9 3v15h3V3H9m3 2l4 13l3-1l-4-13l-3 1M5 5v13h3V5H5M3 19v2h18v-2H3Z"/>
		</svg></div>`)
			.click(() => { this.refreshBookList(); resetUI(); })
			.prependTo($("#btnWrapper"))
			.hide();

		settingMgr.groups["Bookshelf"] = new SettingGroupBookshelf();
		settingMgr.load("Bookshelf").apply("Bookshelf");
	},
};

STRe_Bookshelf.init();
STRe_ProgressOnServer.init();
STRe_FilesOnServer.init();

// 启动时打开上次阅读书籍
if (settingMgr.groups["Bookshelf"].settings["reopen"].value) {
	// if (STRe_Settings.settings.enableRos.val) {
	STRe_Bookshelf.reopenBook();
}

if (DPR > 1) {
	setCSS(`:root`, `font-size`, `${12 * DPR}px`);
	setCSS("dialog", "height", "100vh");
	setCSS("#settingDlg .setting-group-UI", "grid-template-columns", "max-content 1fr");
}
