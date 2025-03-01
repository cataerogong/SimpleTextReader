# SimpleTextReader-enhance - 易笺﹒改

> `个人需求定制版`，具体见 [README-enhance.md](README-enhance.md)


# SimpleTextReader - 易笺

SimpleTextReader is the online text reader that simulates the result of SimpleEpub2, providing a web-based reading experience.

Official site: [https://reader.yijian.app](https://reader.yijian.app)

Big thanks to [Manjusaka](https://github.com/Zheaoli) for his amazing help and hosting 易笺! Really appreciate it!

## Important Updates

### Version 1.0

Now SimpleTextReader is also available as a Chrome/Firefox extension with two distinct versions:

1. Regular version: Upon clicking the icon from the extension list, the full UI appears, providing the same functionality as the complete SimpleTextReader web app.

2. No-UI version: Once activated, any URL ending in ".txt" will be automatically opened using SimpleTextReader. However, please be aware that this version might have slower performance when opening large text files. The delay is due to the browser's default behavior of loading the entire file at once, which cannot be modified.

### Version 1.1

Now SimpleTextReader can be installed as a PWA in supported browsers (Chromium-based browsers such as Chrome and Edge).

### Version 1.2

Enable dark mode.

## Usage

### Load unpacked extensions

Clone the repo, navigate to the `manifests` directory, choose either `Chrome` or `Firefox` directory depending on your browser of choice, choose the regular version and/or the no-ui version, and copy the desired version of `manifest.json` into the root directory. Then load the extension in the browser under `Developer mode`.

### Download from online stores

Firefox:

1. [Regular (EN)](https://addons.mozilla.org/en-US/firefox/addon/yijian/) | [易笺 (CN)](https://addons.mozilla.org/zh-CN/firefox/addon/yijian/)

2. [No-UI (EN)](https://addons.mozilla.org/en-US/firefox/addon/yijian_nogui/) | [易笺无界面版 (CN)](https://addons.mozilla.org/zh-CN/firefox/addon/yijian_nogui/)

Chrome:

1. [Regular](https://chrome.google.com/webstore/detail/%E6%98%93%E7%AC%BA/dbanahlbopbjpgdkecmclbbonhpohcaf?hl=en&authuser=0)

2. [No-UI](https://chrome.google.com/webstore/detail/%E6%98%93%E7%AC%BA%EF%BC%88%E6%97%A0%E7%95%8C%E9%9D%A2%E7%89%88%EF%BC%89/mifnkjlmnnaamfgmhmjdjiplaaladjlo?hl=en&authuser=0)

---

### This project is only for personal use and for learning purpose, not for commercial use.
