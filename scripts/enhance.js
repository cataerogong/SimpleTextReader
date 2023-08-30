const __STRS_VER__ = "0.3.0";

(function () {
	const FUNC_KEYDOWN_ = document.onkeydown; // 保存页面原来的 onkeydown 函数，下面会临时屏蔽 onkeydown

	let MOD_ICON_POS = 70;

	// SVG icons
	$("head").append(`<svg>
<symbol id="settings" viewBox="0 -960 960 960">
	<path d="M546-80H414q-11 0-19.5-7T384-105l-16-101q-19-7-40-19t-37-25l-93 43q-11 5-22 1.5T159-220L93-337q-6-10-3-21t12-18l86-63q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-86-63q-9-7-12-18t3-21l66-117q6-11 17-14.5t22 1.5l93 43q16-13 37-25t40-18l16-102q2-11 10.5-18t19.5-7h132q11 0 19.5 7t10.5 18l16 101q19 7 40.5 18.5T669-710l93-43q11-5 22-1.5t17 14.5l66 116q6 10 3.5 21.5T858-584l-86 61q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l86 62q9 7 12 18t-3 21l-66 117q-6 11-17 14.5t-22-1.5l-93-43q-16 13-36.5 25.5T592-206l-16 101q-2 11-10.5 18T546-80Zm-66-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-60q-29 0-49.5-20.5T410-480q0-29 20.5-49.5T480-550q29 0 49.5 20.5T550-480q0 29-20.5 49.5T480-410Zm0-70Zm-44 340h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Z"/>
</symbol>
<symbol id="link" viewBox="0 -960 960 960">
	<path d="M280-280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h140q12.75 0 21.375 8.675 8.625 8.676 8.625 21.5 0 12.825-8.625 21.325T420-620H280q-58.333 0-99.167 40.765-40.833 40.764-40.833 99Q140-422 180.833-381q40.834 41 99.167 41h140q12.75 0 21.375 8.675 8.625 8.676 8.625 21.5 0 12.825-8.625 21.325T420-280H280Zm75-170q-12.75 0-21.375-8.675-8.625-8.676-8.625-21.5 0-12.825 8.625-21.325T355-510h250q12.75 0 21.375 8.675 8.625 8.676 8.625 21.5 0 12.825-8.625 21.325T605-450H355Zm185 170q-12.75 0-21.375-8.675-8.625-8.676-8.625-21.5 0-12.825 8.625-21.325T540-340h140q58.333 0 99.167-40.765 40.833-40.764 40.833-99Q820-538 779.167-579 738.333-620 680-620H540q-12.75 0-21.375-8.675-8.625-8.676-8.625-21.5 0-12.825 8.625-21.325T540-680h140q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H540Z"/>
</symbol>
<symbol id="clock_loader_40" viewBox="0 -960 960 960">
	<path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-60q68 0 130.62-25.806Q673.239-191.613 721-240L480-480v-340q-142 0-241 98.812Q140-622.375 140-480t98.812 241.188Q337.625-140 480-140Z"/>
</symbol>
<symbol id="cloud" viewBox="0 -960 960 960">
	<path d="M251-160q-88 0-149.5-61.5T40-371q0-78 50-137t127-71q20-97 94-158.5T482-799q112 0 189 81.5T748-522v24q72-2 122 46.5T920-329q0 69-50 119t-119 50H251Zm0-60h500q45 0 77-32t32-77q0-45-32-77t-77-32h-63v-84q0-91-61-154t-149-63q-88 0-149.5 63T267-522h-19q-62 0-105 43.5T100-371q0 63 44 107t107 44Zm229-260Z"/>
</symbol>
</svg>`);

	// CSS
	$("head").append(`<style>
.icon-btn {
    cursor: pointer;
    position: fixed;
    right: 20px;
    padding: 4px;
    z-index: 1005;
}
dialog {
    border-radius: 10px;
    font-family: ui;
    font-size: 1.2rem;
    background: var(--bgColor);
    color: var(--fontColor);
}
dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
}
.dlg-close-btn {
    cursor: pointer;
    float: right;
}
.dlg-body {
    display: block;
    overflow: auto;
    margin: 10px 20px;
    padding: 5px;
}
.dlg-body input[type="text"] {
    float: right;
    margin: 1px;
    border: 1px solid;
    font-family: ui;
    font-size: 1.2rem;
    background: var(--bgColor);
    color: var(--fontColor);
}
.dlg-body button {
    font-family: ui;
    padding: 2px 10px;
    border: 1px solid;
    border-radius: 5px;
    font-size: 1.2rem;
    background: var(--bgColor);
    color: var(--fontColor);
}
.dlg-body .progress {
	padding-left: 50px;
	opacity: 0.3;
	float: right;
}
.dlg-body .progress svg {
    width: 1em;
    height: 1em;
    stroke: var(--fontColor);
    fill: var(--fontColor);
	vertical-align: middle;
}
input[type="checkbox"].dlg-chk {
	display: inline;
}
#pagination:hover {
    opacity: 1;
}
</style>`);

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
					// console.log(sel + " { " + prop + " : " + (val?val:defVal) + " }");
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
	let pagination_opacity_default = "1";

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
	<span>分页条透明度：</span>
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
		document.getElementById("settingDlg").showModal();
		// document.getElementById("settingDlg").
		document.onkeydown = null;
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
	}

	loadSettings();
	applySettings();

	// $(`<div class="icon-btn" style="bottom:${MOD_ICON_POS}px;"><svg class="icon"><use xlink:href="#settings"></use></svg></div>`)
	// 	.click(showSettingDlg).insertBefore("#switch");
	$("#setting-btn").click(showSettingDlg);
	MOD_ICON_POS += 50;


	// ------------------------------------------------
	// Open Link
	// ------------------------------------------------
	// 	function openLink(link) {
	// 		let xhr = new XMLHttpRequest();
	// 		xhr.open("get", link, true);
	// 		xhr.responseType = "blob";
	// 		xhr.onload = function () {
	// 			// console.log(this.response);
	// 			resetVars();
	// 			this.response.name = decodeURI(link);
	// 			handleSelectedFile([this.response]);
	// 		}
	// 		xhr.send();
	// 		showLoadingScreen();
	// 	}

	// 	function showOpenLink() {
	// 		let link = prompt("打开 txt 链接");
	// 		if (!link)
	// 			return;
	// 		openLink(link);
	// 	}

	// 	$(`<div class="icon-btn" style="bottom:${MOD_ICON_POS}px;"><svg class="icon"><use xlink:href="#link" /></svg></div>`)
	// 		.insertBefore("#switch").click(showOpenLink);
	// 	MOD_ICON_POS += 50;


	// ------------------------------------------------
	// Open file on server
	// ------------------------------------------------
	const strs_server = ""; // "http://localhost:8001";
	const strs_tag = "☁|";
	const strs_file_item = "STRS_FILE";

	let strs_file = localStorage.getItem(strs_file_item);
	let strs_file_line = ""; // strs_tag + filename + ":" + line
	let strs_progress_on_server = false; // 服务端阅读进度

	// 检查服务端 '/progress' 目录是否存在
	try {
		WebDAV.Fs(strs_server).dir("/progress").children();
		strs_progress_on_server = true;
	} catch (e) {
		strs_progress_on_server = false;
	}

	function openFileOnServer(fname) { // fname: 不带 strs_tag 的文件名
		let link = strs_server + "/books/" + fname;
		let xhr = new XMLHttpRequest();
		xhr.open("get", link, true);
		// 实际使用中，小说文件没必要强制刷新，使用缓存更节省时间和流量
		// xhr.setRequestHeader("If-Modified-Since", "0"); // 强制刷新，不使用缓存
		xhr.responseType = "blob";
		xhr.onload = function () {
			// console.log(this.response);
			loadProgressFromServer(fname, () => {
				resetVars();
				localStorage.setItem(strs_file_item, fname);
				this.response.name = strs_tag + fname;
				handleSelectedFile([this.response]);
			});
		}
		xhr.send();
		showLoadingScreen();
	}

	function showOpenFileOnServerDlg() {
		$(`<dialog id="openFileOnServerDlg" style="min-width:300px;">
            <div><span id="openFileOnServerDlgCloseBtn" class="dlg-close-btn">&times;</span></div>
            <span id="openFileOnServerDlgBooklist" class="dlg-body" style="height:400px;overflow-y:scroll;">
            	<img src="./images/loading_geometry.gif" style="height:350px;" />
            </span>
            </dialog>`).bind("cancel", hideOpenFileOnServerDlg).insertAfter("#switch-btn");
		$("#openFileOnServerDlgCloseBtn").click(hideOpenFileOnServerDlg);
		document.getElementById("openFileOnServerDlg").showModal();
		document.onkeydown = null;

		let fs = WebDAV.Fs(strs_server);
		let fname_list = [];
		try {
			for (const f of fs.dir("/books").children()) {
				let fname = decodeURIComponent(f.name);
				if (fname.substring(fname.length - 4).toLowerCase() == ".txt")
					fname_list.push([fname, ""]);
			}
			if (strs_progress_on_server) {
				for (const f of fs.dir("/progress").children()) {
					let fname = decodeURIComponent(f.name);
					if (fname.substring(fname.length - 9).toLowerCase() == ".progress") {
						fname = fname.substring(0, fname.length - 9);
						let book = fname_list.find((e) => e[0].toLowerCase() == fname.toLowerCase());
						if (book)
							book[1] = '<svg><use xlink:href="#clock_loader_40" /></svg>' + f.read();
					}
				}
			}
		} catch (e) {
			console.log(e);
		}
		fname_list.sort((a, b) =>
			((a[1] && b[1]) || (!a[1] && !b[1]))
				? (a[0].localeCompare(b[0], "zh"))
				: (a[1] ? -1 : 1));
		// console.log(fname_list);
		let booklist = $("#openFileOnServerDlgBooklist");
		booklist.html("");
		for (const f of fname_list) {
			booklist.append(`<div class="strs-book" style="cursor:pointer;border:1px gray dotted;padding:2px 3px;margin:5px 0px;" strs_data="${f[0]}">
                <span>${f[0]}</span><span class="progress" id="progress-${f[0]}">${f[1]}</span>
                </div>`);
		}
		$(".strs-book").click((evt) => {
			openFileOnServer(evt.currentTarget.attributes["strs_data"].value);
			hideOpenFileOnServerDlg();
		});
	}

	function hideOpenFileOnServerDlg() {
		$('#openFileOnServerDlg').remove();
		document.onkeydown = FUNC_KEYDOWN_;
	}

	function saveProgressToServer() {
		if (!strs_progress_on_server) // 不开启云端进度
			return;
		if ((filename) && (filename.substring(0, strs_tag.length) == strs_tag)) { // file on server
			if (contentContainer.style.display == "none") { // 阅读区域不可见，说明可能正在drag，getTopLineNumber()会取到错误行数，应该跳过
				// console.log("skip");
				return;
			}
			let line = getTopLineNumber(filename);
			if ((filename + ":" + line) != strs_file_line) {
				console.log("saveProgressToServer: " + filename + ":" + line);
				localStorage.setItem(strs_file_item, filename.substring(strs_tag.length));
				let prog_file = WebDAV.Fs(strs_server).file("/progress/" + filename.substring(strs_tag.length) + ".progress");
				prog_file.write(line);
				strs_file_line = filename + ":" + line;
			}
		} else { // local file
			localStorage.removeItem(strs_file_item);
			strs_file_line = "";
		}
	}

	function loadProgressFromServer(fname, onload) { // fname: 不带 strs_tag 的文件名
		if (!strs_progress_on_server) { // 不开启云端进度
			if (onload) {
				// console.log('loadProgressFromServer.onload');
				onload();
			}
			return;
		}
		WebDAV.Fs(strs_server).file("/progress/" + fname + ".progress").read((data) => {
			if (!isNaN(data)) { // 取到服务端进度，同步到 localStorage
				let line = parseInt(data);
				console.log("loadProgressFromServer: " + fname + ":" + line);
				setHistory(strs_tag + fname, line);
				strs_file_line = strs_tag + fname + ":" + line;
			} else {
				strs_file_line = strs_tag + fname + ":" + (localStorage.getItem(strs_tag + fname)||0);
			}
			if (onload) { // 进度已同步，继续处理
				// console.log('loadProgressFromServer.onload');
				onload();
			}
		});
	}

	function strs_worker() { // 定时将当前书在 localStorage 里的进度保存到服务器上
		saveProgressToServer();
		window.parent.document.title = document.title;
		setTimeout(strs_worker, 1000);
	}

	// hack WebDAV.js functions
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

	replace_func(WebDAV, "request", "request____copy", function () {
		headers["If-Modified-Since"] = "0"; // 强制刷新，不使用缓存
		// console.log(headers);
		return this.request____copy(verb, url, headers, data, type, callback);
	});

	if (strs_file) {
		openFileOnServer(strs_file);
	}
	strs_worker();

	$(`<div class="icon-btn" style="bottom:${MOD_ICON_POS}px;"><svg class="icon"><use xlink:href="#cloud" /></svg></div>`)
		.insertBefore("#switch").click(showOpenFileOnServerDlg);
	MOD_ICON_POS += 50;

})();
