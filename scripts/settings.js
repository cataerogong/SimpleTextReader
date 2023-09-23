// ------------------------------------------------
// Module <Settings>
// ------------------------------------------------

class SettingBase {
    type = "";

    constructor(id, desc, defaultValue) {
        this._id_prefix = "";
        this.id = id;
        this.desc = desc;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
    };

    /**
     * @returns {string}
     */
    get full_id() {
        return this._id_prefix + this.id;
    }
    /**
     * @param {string} id_prefix
     */
    set id_prefix(id_prefix) {
        this._id_prefix = id_prefix;
    }
    /**
     * @returns {string}
     */
    get id_prefix() {
        return this._id_prefix;
    }

    genInputElm(attrs = "") {
        return `<input type="${this.type}" id="${this.full_id}" value="${this.value}" ${attrs} />`;
    }
    genLabelElm(attrs = "") {
        return `<span id="${this.full_id}-lbl" ${attrs}>${this.desc}</span>`;
    }
    getInputVal() {
        this.value = document.getElementById(this.full_id).value || this.defaultValue;
        return this;
    }
    setVal(value) {
        this.value = (value == null) ? this.defaultValue : value;
        return this;
    }
}

class SettingText extends SettingBase {
    type = "text";
}

class SettingCheckbox extends SettingBase {
    type = "checkbox";

    constructor(id, desc, defaultValue) {
        super(id, desc, !!defaultValue);
    }
    genInputElm(attrs = "") {
        if (this.value == null) this.value = this.defaultValue;
        return `<input type="${this.type}" id="${this.full_id}" ${this.value ? "checked" : ""} ${attrs} />`;
    }
    genLabelElm(attrs = "") {
        return `<label id="${this.full_id}-lbl" for="${this.full_id}" ${attrs}>${this.desc}</label>`;
    }
    getInputVal() {
        this.value = document.getElementById(this.full_id).checked;
        return this;
    }
}

class SettingSelect extends SettingText {
    type = "select";

    /**
     * 
     * @param {string} id 
     * @param {string} desc 
     * @param {string|null} defaultValue 
     * @param {[{value, text}]} options
     *  ```
     *  [
     *      {value: "val-1", text: "text 1"},
     *      {value: "val-2", text: "text 2"},
     *      ...
     *  ]
     * ```
     */
    constructor(id, desc, defaultValue, options) {
        super(id, desc, defaultValue);
        this.options = options;
    }
    genInputElm(attrs = "") {
        if (this.value == null) this.value = this.defaultValue;
        let str = `<select id="${this.full_id}" ${attrs}>`;
        for (const opt of this.options) {
            str += `<option value="${opt.value}" ${(opt.value == this.value) ? "selected" : ""}>${opt.text}</option>`;
        }
        str += "</select>";
        return str;
    }
}

// Float
class SettingNumber extends SettingText {
    type = "number";

    constructor(id, desc, defaultValue) {
        super(id, desc, isNaN(defaultValue) ? 0 : parseFloat(defaultValue));
    }
    genInputElm(attrs = "") {
        return super.genInputElm(`step="any" ` + attrs);
    }
    getInputVal() {
        super.getInputVal();
        this.value = isNaN(this.value) ? this.defaultValue : parseFloat(this.value);
        return this;
    }
}

// Int
class SettingInt extends SettingText {
    type = "number";

    constructor(id, desc, defaultValue) {
        super(id, desc, isNaN(defaultValue) ? 0 : Math.trunc(parseFloat(defaultValue)));
    }
    genInputElm(attrs = "") {
        return super.genInputElm(`step="1" ` + attrs);
    }
    getInputVal() {
        super.getInputVal();
        this.value = isNaN(this.value) ? this.defaultValue : Math.trunc(parseFloat(this.value));
        return this;
    }
}

class SettingGroupBase {
    constructor(id, desc) {
        this._id_prefix = "";
        this.id = id;
        this.desc = desc;
        this.settings = {};
    }

    /**
     * @returns {string}
     */
    get full_id() {
        return this._id_prefix + this.id;
    }
    /**
     * @param {string} prefix
     */
    set id_prefix(prefix) {
        this._id_prefix = prefix;
        for (const k in this.settings) {
            this.get(k).id_prefix = this.full_id + "_";
        }
    }
    /**
     * @returns {string}
     */
    get id_prefix() {
        return this._id_prefix;
    }

    getInputVals() {
        for (const k in this.settings) {
            this.get(k).getInputVal();
        }
        return this;
    }
    exportValues() {
        let stObj = {};
        for (const k in this.settings) {
            stObj[k] = this.get(k).value;
        }
        return stObj;
    }
    importValues(stObj) {
        for (const k in this.settings) {
            this.get(k).setVal((k in stObj) ? stObj[k] : null);
        }
        return this;
    }

    genHTML() {
        return `<div>需要重载 ${this.id}(${this.desc}) 参数设置类 getHTML() 函数</div>`;
    }
    apply() {
        throw new Error(`SettingGroup ${this.id}(${this.desc}) apply() not implicated!`);
    }

    /**
     * 
     * @param {SettingBase} settingInstance
     * @returns {this}
     */
    add(settingInstance) {
        if (!settingInstance instanceof SettingBase)
            throw new TypeError("Not a SettingBase instance.");
        if (!settingInstance.id)
            throw new Error("Setting id is empty.");
        if (settingInstance.id in this.settings)
            throw new Error("Setting already exists. Id: " + settingInstance.id);
        settingInstance.id_prefix = this.full_id + "_";
        this.settings[settingInstance.id] = settingInstance;
        return this;
    }
    /**
     * 
     * @param {string} settingId 
     * @returns {SettingBase | undefined}
     */
    get(settingId) {
        return this.settings[settingId];
    }
}

var settingMgr = {

    enabled: false,
    ITEM_SETTINGS: "Settings",
    ON_KEYDOWN: document.onkeydown,

    groups: {},

    show() {
        if (this.enabled) {
            let dlg = $(`<dialog id="settingDlg">
				<div class="dlg-cap">设置</div>
				<span class="dlg-body"></span>
				<div class="dlg-foot"></div>
				</dialog>`).bind("cancel", () => this.hide());
            dlg.find(".dlg-cap").append($(`<span class="dlg-close">&times;</span>`).click(() => this.hide()));
            dlg.find(".dlg-foot").append(`<span style="font-size:1rem;color:var(--fontInfoColor);">易笺﹒改 v${_STRe_VER_}</span>`);
            dlg.find(".dlg-foot").append($(`<button style="float:right;margin-left:1rem;">应用</button>`).click(() => this.save().apply().hide()))
            dlg.find(".dlg-foot").append($(`<button style="float:right;">恢复默认</button>`).click(() => this.reset().apply().hide()));
            let container = dlg.find(".dlg-body");
            for (k in this.groups) {
                container.append(this.get(k).genHTML());
            }
            freezeContent();
            dlg.appendTo("body");
            dlg[0].showModal();
            setEscapeFunc(() => settingMgr.hide());
        }
        return this;
    },

    hide() {
        if (this.enabled) {
            $("#settingDlg").remove();
            unfreezeContent();
            setEscapeFunc(null);
        }
        return this;
    },

    load(groupId = "") {
        let stObj = JSON.parse(localStorage.getItem(this.ITEM_SETTINGS)) || {};
        if (groupId) {
            if (groupId in this.groups) {
                this.get(groupId).importValues(stObj[groupId] || {});
            }
        } else {
            for (const grp in this.groups) {
                this.get(grp).importValues(stObj[grp] || {});
            }
        }
        return this;
    },

    save() {
        let stObj = {};
        for (const grp in this.groups) {
            stObj[grp] = this.get(grp).getInputVals().exportValues();
        }
        localStorage.setItem(this.ITEM_SETTINGS, JSON.stringify(stObj));
        return this;
    },

    reset() {
        if (this.enabled) {
            localStorage.removeItem(this.ITEM_SETTINGS);
            this.load();
        }
        return this;
    },

    apply(groupId = "") {
        if (this.enabled) {
            if (groupId) {
                if (groupId in this.groups) {
                    this.get(groupId).apply();
                }
            } else {
                for (const grp in this.groups) {
                    this.get(grp).apply();
                }
            }
        }
        return this;
    },

    enable() {
        if (!this.enabled) {
            $("#STRe-setting-btn").show();
            this.enabled = true;
            console.log("Module <Settings> enabled.");
        }
        return this;
    },

    disable() {
        if (this.enabled) {
            this.hide().reset().load().apply();
            $("#STRe-setting-btn").hide();
            this.enabled = false;
            console.log("Module <Settings> disabled.");
        }
        return this;
    },

    /**
     * 
     * @returns {ThisObj}
     */
    init() {
        $(`<div id="STRe-setting-btn" class="btn-icon">
		<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path stroke="none" d="M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2m-2 12c-.25 0-.46-.18-.5-.42l-.37-2.65c-.63-.25-1.17-.59-1.69-.99l-2.49 1.01c-.22.08-.49 0-.61-.22l-2-3.46a.493.493 0 0 1 .12-.64l2.11-1.66L4.5 12l.07-1l-2.11-1.63a.493.493 0 0 1-.12-.64l2-3.46c.12-.22.39-.31.61-.22l2.49 1c.52-.39 1.06-.73 1.69-.98l.37-2.65c.04-.24.25-.42.5-.42h4c.25 0 .46.18.5.42l.37 2.65c.63.25 1.17.59 1.69.98l2.49-1c.22-.09.49 0 .61.22l2 3.46c.13.22.07.49-.12.64L19.43 11l.07 1l-.07 1l2.11 1.63c.19.15.25.42.12.64l-2 3.46c-.12.22-.39.31-.61.22l-2.49-1c-.52.39-1.06.73-1.69.98l-.37 2.65c-.04.24-.25.42-.5.42h-4m1.25-18l-.37 2.61c-1.2.25-2.26.89-3.03 1.78L5.44 7.35l-.75 1.3L6.8 10.2a5.55 5.55 0 0 0 0 3.6l-2.12 1.56l.75 1.3l2.43-1.04c.77.88 1.82 1.52 3.01 1.76l.37 2.62h1.52l.37-2.61c1.19-.25 2.24-.89 3.01-1.77l2.43 1.04l.75-1.3l-2.12-1.55c.4-1.17.4-2.44 0-3.61l2.11-1.55l-.75-1.3l-2.41 1.04a5.42 5.42 0 0 0-3.03-1.77L12.75 4h-1.5Z"/>
		</svg></div>`)
            .click(() => this.show())
            .appendTo($("#btnWrapper"))
            .hide();
        return this;
    },

    /**
     * 
     * @param {SettingGroupBase} groupInstance 
     * @param {Boolean} loadAfterAdd 
     * @param {Boolean} applyAfterLoad 
     * @returns {ThisObj}
     */
    add(groupInstance, loadAfterAdd = true, applyAfterLoad = true) {
        if (!groupInstance instanceof SettingGroupBase)
            throw new TypeError("Not a SettingGroupBase instance.");
        if (!groupInstance.id)
            throw new Error("Group id is empty.");
        if (groupInstance.id in this.groups)
            throw new Error("Group already exists. Id: " + groupInstance.id);
        groupInstance.id_prefix = "settingMgr_";
        this.groups[groupInstance.id] = groupInstance;
        if (loadAfterAdd) {
            this.load(groupInstance.id);
            if (applyAfterLoad)
                this.apply(groupInstance.id);
        }
        return this;
    },

    /**
     * 
     * @param {string} groupId 
     * @returns {SettingGroupBase}
     */
    get(groupId) {
        return this.groups[groupId];
    },
}

// 启用参数设置模块
settingMgr.init().enable();

// 设置示例
/*
class SettingGroupExample extends SettingGroupBase {
    constructor() {
        super("setting-group-Example", "示例设置");
        this.settings["setting-1"] = new SettingCheckbox(this.id + "-setting-1", "是/否", true);
        this.settings["setting-2"] = new SettingText(this.id + "-setting-2", "字符串", "default loooooooooooooooong text");
        this.settings["setting-3"] = new SettingNumber(this.id + "-setting-3", "数字", 0.1);
        this.settings["setting-4"] = new SettingInt(this.id + "-setting-4", "整数", 1);
    }
    genHTML() {
        let sts = this.settings;
        let html = `<div class="sub-cap">${this.desc}</div>
            <div class="setting-group setting-group-example">
            <div class="row">${sts["setting-1"].genLabelElm()} ${sts["setting-1"].genInputElm()}</div>
            ${sts["setting-2"].genLabelElm()} ${sts["setting-2"].genInputElm()}
            ${sts["setting-3"].genLabelElm()} ${sts["setting-3"].genInputElm()}
            ${sts["setting-4"].genLabelElm()} ${sts["setting-4"].genInputElm()}
            </div>`;
        return html;
    }
    apply() {
        return this;
    }
}

settingMgr.groups["Example"] = new SettingGroupExample();
settingMgr.load("Example").apply("Example");
// */

// --------------------------------------
// 界面参数设置
class SettingCSS extends SettingText {
    constructor(id, desc, selector, property, defaultValue = null) {
        super(id, desc, defaultValue);
        this.selector = selector;
        this.property = property;
        if (defaultValue == null) {
            this.defaultValue = getCSS(this.selector, this.property);
        }
    }
}

class SettingCSSGlobalVar extends SettingText {
    constructor(id, desc, property) {
        super(id, desc, style[property]);
        this.property = property;
    }
}

class SettingGroupUI extends SettingGroupBase {
    constructor() {
        super("UI", "界面参数");
        this.add(new SettingCSSGlobalVar("p_lineHeight", "行高", "--p_lineHeight"));
        this.add(new SettingCSSGlobalVar("p_fontSize", "字号", "--p_fontSize"));
        this.add(new SettingCSSGlobalVar("fontColor-0", "日间字符色", "--fontColor-0"));
        this.add(new SettingCSSGlobalVar("bgColor-0", "日间背景色", "--bgColor-0"));
        this.add(new SettingCSSGlobalVar("fontColor-1", "夜间字符色", "--fontColor-1"));
        this.add(new SettingCSSGlobalVar("bgColor-1", "夜间背景色", "--bgColor-1"));
        this.add(new SettingCSSGlobalVar("pagination_bottom", "分页条与底部距离", "--pagination_bottom"));
        this.add(new SettingCSSGlobalVar("pagination_opacity", "分页条透明度(0.0~1.0)", "--pagination_opacity"));
    }

    genHTML() {
        let html = `<div id="${this.full_id}" class="setting-group"><div class="sub-cap">${this.desc}</div>`;
        html += `<div class="setting-group-settings">`;
        for (const k in this.settings) {
            let st = this.get(k);
            // if (st instanceof SettingCSS)
                html += st.genLabelElm() + st.genInputElm(`style="width:6rem;"`);
        }
        html += "</div></div>";
        return html;
    }

    apply() {
        for (const k in this.settings) {
            let st = this.get(k);
            if (st instanceof SettingCSS)
                setCSS(st.selector, st.property, st.value);
            else if (st instanceof SettingCSSGlobalVar)
                style[st.property] = st.value;
        }
        style = new CSSGlobalVariables();
        return this;
    }
}

// 加载“界面参数”设置
settingMgr.add(new SettingGroupUI());


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

    apply() {
        setFlowMode(this.get("page-mode").value == "flow");
        showLineNumber(this.get("show-line-num").value);
        // reader mode 必须在 flow mode 和 show line number 后设置
        // 因为 log mode 要强制覆盖 flow mode 和 show line number
        setReaderMode(this.get("reader-mode").value);
        return this;
    }
}

// 加载“阅读模式”设置
settingMgr.add(new SettingGroupMode());
