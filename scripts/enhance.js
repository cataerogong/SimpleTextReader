const __STRe_ver__ = "0.1.0";

(function () {
	const FUNC_KEYDOWN_ = document.onkeydown; // 保存页面原来的 onkeydown 函数，下面会临时屏蔽 onkeydown

	// hack helper
	function get_func_args(func) {
		let re = /^\s*function\s*\w*\s*\(([^\)]*)\)[^{]*{.*}\s*$/si;
		let r = re.exec(func.toString());
		return r ? r[1] : "";
	}
	function get_func_body(func) {
		let re = /^\s*function\s*\w*\s*\([^\)]*\)[^{]*{(.*)}\s*$/si;
		let r = re.exec(func.toString());
		return r ? r[1] : "";
	}
	function replace_func(func_owner, func_name, func_copyname, new_func) {
		func_owner[func_copyname] = new Function(get_func_args(func_owner[func_name]), get_func_body(func_owner[func_name]));
		func_owner[func_name] = new Function(get_func_args(func_owner[func_name]), get_func_body(new_func));
	}

	// 夹带点私货，我的小说命名规则是：书名.[作者]
	replace_func(window, "getBookNameAndAuthor", "getBookNameAndAuthor____copy", function () {
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

	function freezeContent() {
		$("body").css("overflow-y", "hidden");
	}
	function unfreezeContent() {
		$("body").css("overflow-y", "auto");
	}

	// ------------------------------------------------
	// Settings
	// ------------------------------------------------
	function getCSS(sel, prop) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText === sel) {
					return rule.style.getPropertyValue(prop);
				}
			}
		}
		return null;
	}
	function setCSS(sel, prop, val, defVal) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText === sel) {
					rule.style.setProperty(prop, val ? val : defVal);
				}
			}
		}
	}

	let p_lineHeight_default = getCSS(":root", "--p_lineHeight");
	let p_fontSize_default = getCSS(":root", "--p_fontSize");
	let light_fontColor_default = getCSS(":root", "--fontColor");
	let light_bgColor_default = getCSS(":root", "--bgColor");
	let dark_fontColor_default = getCSS('[data-theme="dark"]', "--fontColor");
	let dark_bgColor_default = getCSS('[data-theme="dark"]', "--bgColor");
	let pagination_bottom_default = getCSS("#pagination", "bottom");
	let pagination_opacity_default = getCSS("#pagination", "opacity");

	let p_lineHeight;
	let p_fontSize;
	let light_fontColor;
	let light_bgColor;
	let dark_fontColor;
	let dark_bgColor;
	let pagination_bottom;
	let pagination_opacity;

	// load settings
	function loadSettings() {
		p_lineHeight = localStorage.getItem("p_lineHeight") || p_lineHeight_default;
		p_fontSize = localStorage.getItem("p_fontSize") || p_fontSize_default;
		light_fontColor = localStorage.getItem("light_fontColor") || light_fontColor_default;
		light_bgColor = localStorage.getItem("light_bgColor") || light_bgColor_default;
		dark_fontColor = localStorage.getItem("dark_fontColor") || dark_fontColor_default;
		dark_bgColor = localStorage.getItem("dark_bgColor") || dark_bgColor_default;
		pagination_bottom = localStorage.getItem("pagination_bottom") || pagination_bottom_default;
		pagination_opacity = localStorage.getItem("pagination_opacity") || pagination_opacity_default;
	}

	function applySettings() {
		setCSS(":root", "--p_lineHeight", p_lineHeight, p_lineHeight_default);
		setCSS(":root", "--p_fontSize", p_fontSize, p_fontSize_default);
		setCSS(":root", "--fontColor", light_fontColor, light_fontColor_default);
		setCSS(":root", "--bgColor", light_bgColor, light_bgColor_default);
		setCSS('[data-theme="dark"]', "--fontColor", dark_fontColor, dark_fontColor_default);
		setCSS('[data-theme="dark"]', "--bgColor", dark_bgColor, dark_bgColor_default);
		setCSS("#pagination", "bottom", pagination_bottom, pagination_bottom_default);
		setCSS("#pagination", "opacity", pagination_opacity, pagination_opacity_default);
	}

	function resetSettings() {
		localStorage.removeItem("p_lineHeight");
		localStorage.removeItem("p_fontSize");
		localStorage.removeItem("light_fontColor");
		localStorage.removeItem("light_bgColor");
		localStorage.removeItem("dark_fontColor");
		localStorage.removeItem("dark_bgColor");
		localStorage.removeItem("pagination_bottom");
		localStorage.removeItem("pagination_opacity");
	}

	function showSettingDlg() {
		$(`<dialog id="settingDlg">
<div><span id="settingDlgCloseBtn" class="dlg-close-btn">&times;</span></div>
<span class="dlg-body">
<div>
	<span>行高：</span>
	<input type="text" size="10" style="float:right" id="setting_p_lineHeight" value="${p_lineHeight}" />
</div>
<div>
	<span>字号：</span>
	<input type="text" size="10" id="setting_p_fontSize" value="${p_fontSize}" />
</div>
<div>
	<span>日间字符色：</span>
	<input type="text" size="10" id="setting_light_fontColor" value="${light_fontColor}" />
</div>
<div>
	<span>日间背景色：</span>
	<input type="text" size="10" id="setting_light_bgColor" value="${light_bgColor}" />
</div>
<div>
	<span>夜间字符色：</span>
	<input type="text" size="10" id="setting_dark_fontColor" value="${dark_fontColor}" />
</div>
<div>
	<span>夜间背景色：</span>
	<input type="text" size="10" id="setting_dark_bgColor" value="${dark_bgColor}" />
</div>
<div>
	<span>分页条与底部距离：</span>
	<input type="text" size="10" id="setting_pagination_bottom" value="${pagination_bottom}" />
</div>
<div>
	<span>分页条透明度(0.0~1.0)：</span>
	<input type="text" size="10" id="setting_pagination_opacity" value="${pagination_opacity}" />
</div>
<div style="padding:4px;margin-top:10px;">
	<button id="settingDlgClrBtn">恢复默认</button>
	<button id="settingDlgOkBtn" style="float:right;">应用</button>
</div>
</span>
</dialog>`).bind("cancel", hideSettingDlg).insertAfter("#switch-btn");
		$("#settingDlgCloseBtn").click(hideSettingDlg);
		$("#settingDlgClrBtn").click(() => { resetSettings(); loadSettings(); applySettings(); hideSettingDlg(); });
		$("#settingDlgOkBtn").click(() => { saveSettings(); applySettings(); hideSettingDlg(); });
		document.onkeydown = null;
		freezeContent();
		document.getElementById("settingDlg").showModal();
	}

	function saveSettings() {
		p_lineHeight = $("#setting_p_lineHeight").val() || p_lineHeight_default;
		p_fontSize = $("#setting_p_fontSize").val() || p_fontSize_default;
		light_fontColor = $("#setting_light_fontColor").val() || light_fontColor_default;
		light_bgColor = $("#setting_light_bgColor").val() || light_bgColor_default;
		dark_fontColor = $("#setting_dark_fontColor").val() || dark_fontColor_default;
		dark_bgColor = $("#setting_dark_bgColor").val() || dark_bgColor_default;
		pagination_bottom = $("#setting_pagination_bottom").val() || pagination_bottom_default;
		pagination_opacity = $("#setting_pagination_opacity").val() || pagination_opacity_default;
		localStorage.setItem("p_lineHeight", p_lineHeight);
		localStorage.setItem("p_fontSize", p_fontSize);
		localStorage.setItem("light_fontColor", light_fontColor);
		localStorage.setItem("light_bgColor", light_bgColor);
		localStorage.setItem("dark_fontColor", dark_fontColor);
		localStorage.setItem("dark_bgColor", dark_bgColor);
		localStorage.setItem("pagination_bottom", pagination_bottom);
		localStorage.setItem("pagination_opacity", pagination_opacity);
	}
	function hideSettingDlg() {
		$("#settingDlg").remove();
		document.onkeydown = FUNC_KEYDOWN_;
		unfreezeContent();
	}

	loadSettings();
	applySettings();

	$("#setting-btn").click(showSettingDlg);


	// ------------------------------------------------
	// Open file on server
	// ------------------------------------------------
	const STRe_server = ""; // "http://localhost:8001";
	const STRe_tag = "☁|";
	const STRe_file_item = "STRe_FILE";
	const STRe_progress_re = /^(\d+)(\/(\d+))?$/i;

	let STRe_file = localStorage.getItem(STRe_file_item);
	let STRe_file_line = ""; // STRe_tag + filename + ":" + line
	let STRe_progress_on_server = false; // 服务端阅读进度

	// 检查服务端 '/progress' 目录是否存在
	try {
		WebDAV.Fs(STRe_server).dir("/progress").children();
		STRe_progress_on_server = true;
	} catch (e) {
		console.log("Can't access '/progress' on server. Turn off progress-on-server function.");
		STRe_progress_on_server = false;
	}

	async function openFileOnServer(fname) { // fname: 不带 STRe_tag 的文件名
		let cache = await bc.GetBook(fname);
		if (cache) {
			console.log("Load book from cache.");
			let resp = cache.response;
			loadProgressFromServer(fname, () => {
				resetVars();
				localStorage.setItem(STRe_file_item, fname);
				resp.name = STRe_tag + fname;
				handleSelectedFile([resp]);
			});
		} else {
			let link = STRe_server + "/books/" + fname;
			let xhr = new XMLHttpRequest();
			xhr.open("get", link, true);
			// 实际使用中，小说文件没必要强制刷新，使用缓存更节省时间和流量
			// xhr.setRequestHeader("If-Modified-Since", "0"); // 强制刷新，不使用缓存
			xhr.responseType = "blob";
			xhr.onload = function () {
				console.log("Save book to cache.");
				bc.PutBook({filename: fname, response: this.response});
				// console.log(this.response);
				loadProgressFromServer(fname, () => {
					resetVars();
					localStorage.setItem(STRe_file_item, fname);
					this.response.name = STRe_tag + fname;
					handleSelectedFile([this.response]);
				});
			}
			xhr.send();
			showLoadingScreen();
		}
	}

	function showOpenFileOnServerDlg() {
		$(`<dialog id="openFileOnServerDlg" style="height:100vh;min-width:50vw;">
            <div class="dlg-title-line"><span id="openFileOnServerDlgCloseBtn" class="dlg-close-btn">&times;</span></div>
            <span id="openFileOnServerDlgBooklist" class="dlg-body" style="overflow-y:scroll;justify-content:center;">
            	<img src="./images/loading_geometry.gif" style="display:block;width:30vw;filter:var(--mainColor_filter); "/>
            </span>
            </dialog>`).bind("cancel", hideOpenFileOnServerDlg).insertAfter("#switch-btn");
		$("#openFileOnServerDlgCloseBtn").click(hideOpenFileOnServerDlg);
		document.onkeydown = null;
		freezeContent();
		document.getElementById("openFileOnServerDlg").showModal();

		let fs = WebDAV.Fs(STRe_server);
		let fname_list = [];
		try {
			for (const f of fs.dir("/books").children()) {
				let fname = decodeURIComponent(f.name);
				if (fname.substring(fname.length - 4).toLowerCase() == ".txt")
					fname_list.push([fname, "", "", ""]); // "filename", "read/total", "percent%"
			}
			if (STRe_progress_on_server) {
				for (const fp of fs.dir("/progress").children()) {
					let fname = decodeURIComponent(fp.name);
					if (fname.substring(fname.length - 9).toLowerCase() == ".progress") {
						fname = fname.substring(0, fname.length - 9);
						let fn = fname_list.find((e) => e[0].toLowerCase() == fname.toLowerCase());
						if (fn) {
							let m = fp.read().match(STRe_progress_re);
							if (m) {
								fn[1] = m[1] + "/" + (m[3]||"?");
								fn[2] = m[3]?(eval(m[0])*100).toFixed(1).replace(".0", "")+"%":"";
							}
						}
					}
				}
			}
		} catch (e) {
			console.log(e);
		}
		fname_list.sort((a, b) =>
				(!!a[1] == !!b[1]) // 判断阅读状态是否相同？（已读 or 未读） // ((a[1] && b[1]) || (!a[1] && !b[1]))
				? (a[0].localeCompare(b[0], "zh")) // 相同，按拼音序
				: (a[1] ? -1 : 1)); // 不同，已读排前面
		// console.log(fname_list);
		let booklist = $("#openFileOnServerDlgBooklist");
		booklist.html("");
		for (const fn of fname_list) {
			booklist.append(`<div class="book-item ${fn[1]?"book-read":""}" style="--book-progress:${fn[2]};"
                title="${"进度："+(fn[1]?(fn[2]+" ("+fn[1]+")"):"无")}" data-book-filename="${fn[0]}">${fn[0]}</div>`);
		}
		$(".book-item").click((evt) => {
			openFileOnServer(evt.currentTarget.attributes["data-book-filename"].value);
			hideOpenFileOnServerDlg();
		});
	}

	function hideOpenFileOnServerDlg() {
		$('#openFileOnServerDlg').remove();
		document.onkeydown = FUNC_KEYDOWN_;
		unfreezeContent();
	}

	function saveProgressToServer() {
		if (!STRe_progress_on_server) // 不开启云端进度
			return;
		if ((filename) && (filename.substring(0, STRe_tag.length) == STRe_tag)) { // file on server
			if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
				// console.log("skip");
				return;
			}
			let line = getTopLineNumber(filename);
			if ((filename + ":" + line) != STRe_file_line) {
				console.log("saveProgressToServer: " + filename + ":" + line + "/" + fileContentChunks.length);
				localStorage.setItem(STRe_file_item, filename.substring(STRe_tag.length));
				let prog_file = WebDAV.Fs(STRe_server).file("/progress/" + filename.substring(STRe_tag.length) + ".progress");
				prog_file.write(line + "/" + fileContentChunks.length);
				STRe_file_line = filename + ":" + line;
			}
		} else { // local file
			localStorage.removeItem(STRe_file_item);
			STRe_file_line = "";
		}
	}

	function loadProgressFromServer(fname, onload) { // fname: 不带 STRe_tag 的文件名
		if (!STRe_progress_on_server) { // 不开启云端进度
			if (onload) {
				// console.log('loadProgressFromServer.onload');
				onload();
			}
			return;
		}
		WebDAV.Fs(STRe_server).file("/progress/" + fname + ".progress").read((data) => {
			let m = data.match(STRe_progress_re);
			if (m) { // 取到服务端进度，同步到 localStorage
				let line = parseInt(m[1]);
				console.log("loadProgressFromServer: " + fname + ":" + line);
				setHistory(STRe_tag + fname, line);
				STRe_file_line = STRe_tag + fname + ":" + line;
			} else {
				STRe_file_line = STRe_tag + fname + ":" + (localStorage.getItem(STRe_tag + fname)||0);
			}
			if (onload) { // 进度已同步，继续处理
				// console.log('loadProgressFromServer.onload');
				onload();
			}
		});
	}

	function STRe_worker() { // 定时将当前书在 localStorage 里的进度保存到服务器上
		saveProgressToServer();
		window.parent.document.title = document.title;
		setTimeout(STRe_worker, 1000);
	}

	// hack WebDAV.js functions
	replace_func(WebDAV, "request", "request____copy", function () {
		headers["If-Modified-Since"] = "0"; // 强制刷新，不使用缓存
		// console.log(headers);
		return this.request____copy(verb, url, headers, data, type, callback);
	});

	if (STRe_file) {
		openFileOnServer(STRe_file);
	}
	STRe_worker();

	$("#cloud-btn").click(showOpenFileOnServerDlg);

})();
