## TODO

> Err ... maybe :-P

* 在文件已经显示的情况下（阅读界面），改变排版模式（书籍、日志）时需要重新处理 `fileContentChunks`，生成 `Title Page`、`TOC` 等

* 书架排序：按照阅读状态排序时，“在读”是否要考虑按照最近阅读时间而非拼音排序。

  这样的话，最近阅读时间需要服务端同步吗？同步的话，每次打开需要同步所有书籍的最近阅读时间吧

* “根据行号定位章节”这个可以考虑用空间换时间，在 `processFileContent` 处理文件时就把每一行对应的章节记下来，就不需要每次重新查找了
