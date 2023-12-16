# SimpleTextReader-enhance - 易笺﹒改

个人需求定制版。

将原先在 [SimpleTextReaderServer](../SimpleTextReaderServer/) 上的增强功能合并到源项目上，不想再累死累活的打补丁了，还是直接改源码爽啊 :-D

* [HISTORY.md](HISTORY.md) 
* [TODO.md](TODO.md)
* [USAGE.md](USAGE.md) 我的自建 WebDAV 方案

## 增强功能

> * [x] = [@henryxrl 的原版STR](https://github.com/henryxrl/SimpleTextReader) 已提供相同或类似功能

* [x] 参数设置
* [x] 本地缓存书架：缓存打开过的小说
* 书架两种排序方式：按拼音/按阅读状态
* [x] 启动时打开上次阅读书籍
* 云端小说阅读（需WebDAV）
* 云端阅读进度保存（需WebDAV）
* 增强键盘操作，用键盘操作目录跳转
* 增加阅读模式“流模式”，一页到底
* 增加进度条，可直接拖动
* 分页阅读模式下，页面到顶/到底自动翻页
* 可显示行号
* 快速跳转：按行号、百分比跳转
* 全文搜索
* 增加排版模式“日志模式”，无目录，直接显示行号和内容，不做任何过滤、替换
