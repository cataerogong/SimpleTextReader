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
