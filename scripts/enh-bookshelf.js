// ------------------------------------------------
// Module <Bookshelf>
// ------------------------------------------------
class SettingGroupBookshelf extends SettingGroupBase {
	constructor() {
		super("bookshelf", "缓存书架");
		this.add(new SettingCheckbox("enable", "启用", true));
		this.add(new SettingCheckbox("reopen", "启动时打开上次阅读书籍", true));
		this.add(new SettingCheckbox("sortByStatus", "按阅读状态分类排序（在读，未读，读完）", true));
	}

	genHTML() {
		let html = `<div id="setting-group-${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>
            <div class="setting-group-settings">
            <div>${this.get("enable").genInputElm()} ${this.get("enable").genLabelElm()}</div>
            <div>${this.get("reopen").genInputElm()} ${this.get("reopen").genLabelElm()}</div>
            <div class="row">${this.get("sortByStatus").genInputElm()} ${this.get("sortByStatus").genLabelElm()}</div>
            </div></div>`;
		return html;
	}

	async apply() {
		STRe_Bookshelf.reopenEnabled = this.get("reopen").value;
		if (STRe_Bookshelf.sortByStatus != this.get("sortByStatus").value) {
			STRe_Bookshelf.sortByStatus = this.get("sortByStatus").value;
			await STRe_Bookshelf.refreshBookList();
		}
		if (this.get("enable").value) {
			await STRe_Bookshelf.enable();
		} else {
			STRe_Bookshelf.disable();
		}
	}

}

var STRe_Bookshelf = {

	enabled: false,
	reopenEnabled : false,
	sortByStatus: false,
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

	// 更新书籍封面的阅读进度
	updateBookProgressInfo(bookInfo, bookElm = null) {
		if (!bookElm) {
			bookElm = $(`.bookshelf .book[data-filename="${bookInfo.filename}"]`);
			if (bookElm.length <= 0) {
				return;
			}
		}
		if (bookInfo.read) {
			bookElm.addClass("read").css("--read-progress", bookInfo.pct);
			bookElm.find(".progress").html(bookInfo.pct).attr("title", `${bookInfo.pct} (${bookInfo.progress})`);
		} else {
			bookElm.removeClass("read").css("--read-progress", "");
 			bookElm.find(".progress").html("&nbsp;").attr("title", "");
		}
		if (bookInfo.completed) {
			bookElm.addClass("completed");
		} else {
			bookElm.removeClass("completed");
		}
	},

	getBookProgress(fname) {
		let ret = {filename: fname, progress: "", pct: "", read: false, completed: false};
		ret.progress = STReHelper.getLocalProgress(fname);
		if (ret.progress) {
			ret.read = true;
			ret.pct = "?%";
			let m = STRe_PROGRESS_RE.exec(ret.progress);
			if (m && m.groups["total"]) {
				ret.pct = ((m.groups["line"] / m.groups["total"]) * 100).toFixed(1) + "%";
				ret.completed = (m.groups["line"] == m.groups["total"]);
			}
		}
		return ret;
	},

	genBookItem(bookInfo) {
		let book = $(`<div class="book ${bookInfo.isEastern ? "eastern" : ""}" data-filename="${bookInfo.filename}">
			<div class="btn-bar"><span class="delete-btn" title="删除">&times;</span></div>
			<div class="cover" title="${bookInfo.filename}">
				<div class="bookname">${bookInfo.bookname}</div>
				<div class="author">${bookInfo.author}</div>
			</div>
			<div class="info">
				<div class="size">${(bookInfo.size/1000/1000).toFixed(2)} MB</div>
				<div class="progress"></div>
			</div></div>`);
		book.find(".cover").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.openBook(bookInfo.filename);
		});
		book.find(".delete-btn").click((evt) => {
			evt.originalEvent.stopPropagation();
			this.deleteBook(bookInfo.filename, () => {
				// this.refreshBookList()
				let b = $(evt.currentTarget).parents(".book");
				// b.fadeOut(500, () => b.remove());
				b.animate({width: 0, opacity: 0}, 500, () => b.remove());
			});
		});
		this.updateBookProgressInfo(bookInfo, book);
		return book;
	},

	async refreshBookList() {
		/**
		 * 调整封面字体大小
		 * @param {HTMLElement} bookElm 必须已加入 DOM Tree
		 */
		function resizeFont(bookElm) {
			let b = $(bookElm).find(".cover")[0];
			let s = parseInt(window.getComputedStyle(b).fontSize.slice(0, -2));
			while ((b.scrollHeight > b.offsetHeight || b.scrollWidth > b.offsetWidth) && s > 12) {
				b.style.setProperty("--cover-font-size", (--s) + "px")
			}
		}

		if (this.enabled) {
			let container = $(".bookshelf .book-list");
			container.html("");
			if (navigator.storage) {
				let storageInfo = await navigator.storage.estimate();
				if (storageInfo) {
					$("#bookshelfUsagePct").html((storageInfo.usage / storageInfo.quota * 100).toFixed(1));
					$("#bookshelfUsage").html((storageInfo.usage / 1000 / 1000).toFixed(2));
					$("#bookshelfQuota").html((storageInfo.quota / 1000 / 1000).toFixed(2));
				}
			} else {
				// 不是 HTTPS 或者 localhost，不能使用 navigator.storage
				// 因此不显示存储使用情况
				// console.log(e);
				$("#bookshelfStorageInfo").hide();
			}
			let booklist = [];
			try {
				for (const book of await this.db.getAllBooks()) {
					let na = getBookNameAndAuthor(book.name.replace(/(.txt)$/i, ''));
					// booklist.push({filename: book.name, bookname: na.bookName, author: na.author, size: book.data.size});
					let info = this.getBookProgress(book.name);
					info.bookname = na.bookName;
					info.author = na.author;
					info.size = book.data.size;
					// info.isEastern = getLanguage(info.bookname);
					booklist.push(info);
				}
				if (this.sortByStatus)
					booklist.sort((a, b) => {
						if (a.completed != b.completed) return (a.completed - b.completed);
						if (a.read != b.read) return (b.read - a.read);
						return (a.bookname.localeCompare(b.bookname, "zh"));
					});
				else
					booklist.sort((a, b) => (a.bookname.localeCompare(b.bookname, "zh")));
				for (const bookInfo of booklist) {
					let book = this.genBookItem(bookInfo).css("visibility", "hidden");
					container.append(book);
					resizeFont(book);
					book.css("visibility", "visible");
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
				<div class="sub-title">【提示】书籍保存在浏览器缓存空间内，可能会被系统自动清除。
				<span id="bookshelfStorageInfo"><br />已用空间：<span id="bookshelfUsagePct"></span>% (<span id="bookshelfUsage"></span> MB / <span id="bookshelfQuota"></span> MB)</span></div>
			</div>
			<span class="book-list"></span>
			</div>`).appendTo("#dropZone");
			await this.refreshBookList();
		}
	},

	loop() {
		if (this.enabled) {
			localStorage.setItem(this.STRe_FILENAME, filename);
			if (filename) {
				this.updateBookProgressInfo(this.getBookProgress(filename));
			}
			setTimeout(() => this.loop(), 1000);
		}
	},

	async enable() {
		if (!this.enabled) {
			this.db = new STReLocalDB();
			fileloadCallback.regBefore(this.saveBook);
			// $("#STRe-bookshelf-btn").show();
			this.enabled = true;
			await this.show();
			console.log("Module <Bookshelf> enabled.");
			setTimeout(() => this.loop(), 1000);
		}
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
	},

	async init() {
		// $(`<div id="STRe-bookshelf-btn" class="btn-icon">
		// <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		// 	<path stroke="none" d="M9 3v15h3V3H9m3 2l4 13l3-1l-4-13l-3 1M5 5v13h3V5H5M3 19v2h18v-2H3Z"/>
		// </svg></div>`)
		// 	.click(() => { resetUI(); })
		// 	.prependTo($("#btnWrapper"))
		// 	.hide();

		await settingMgr.add(new SettingGroupBookshelf());
	},

    destroy() {
        this.disable();
        settingMgr.del("bookshelf");
    },
};

(async () => {
	await STRe_Bookshelf.init();
	// 启动时打开上次阅读书籍
	await STRe_Bookshelf.reopenBook();
})();
