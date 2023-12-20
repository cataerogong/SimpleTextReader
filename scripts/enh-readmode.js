class SettingGroupMode extends SettingGroupBase {
    constructor() {
        super("mode", "阅读模式");
        let options = [
            { value: "book", text: "书籍 - 自动提取目录，替换净化，行首缩进等" },
            { value: "log", text: "日志 - 内容不做任何修改，显示行号，无目录" },
            { value: "auto", text: `自动 - 文件名中有 "log" 的文件用 日志模式 打开` },
        ];
        this.add(new SettingSelect("reader-mode", "排版模式", "auto", options));
        options = [
            { value: "page", text: "页模式 - 分页条、⇦/⇨翻页" },
            { value: "flow", text: "流模式 - 滚动，无需翻页" },
        ];
        this.add(new SettingSelect("page-mode", "翻页模式", "page", options));
        this.add(new SettingCheckbox("show-line-num", "显示行号", false));
    }

    genHTML() {
        let html = `<div id="${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>
        <div class="setting-group-settings">
        ${this.get("reader-mode").genLabelElm()} ${this.get("reader-mode").genInputElm(`style="width:max-content;"`)}
        ${this.get("page-mode").genLabelElm()} ${this.get("page-mode").genInputElm(`style="width:max-content;"`)}
        <div class="row">${this.get("show-line-num").genInputElm()} ${this.get("show-line-num").genLabelElm()}</div>
        </div></div>`;
        return html;
    }

    async apply() {
        setFlowMode(this.get("page-mode").value == "flow");
        showLineNumber(this.get("show-line-num").value);
        // reader mode 必须在 flow mode 和 show line number 后设置
        // 因为 log mode 要强制覆盖 flow mode 和 show line number
        setReaderMode(this.get("reader-mode").value);
    }
}

// 加载“阅读模式”设置
settingMgr.add(new SettingGroupMode());
