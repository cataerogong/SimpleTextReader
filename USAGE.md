【写在前面】我用的是本机搭建的 WebDAV，同时充当 HTTP Server 来跑 SimpleTextReader，就是说 STR 和 WebDAV 是同一个服务器，所以不存在 CORS 问题。

### WebDAV Server

我用这个：https://github.com/hacdias/webdav

### 配置文件 `config.yaml`

```yaml
# Server related settings
address: 127.0.0.1
port: 8000
auth: false
tls: false
cert: cert.pem
key: key.pem
prefix: /

# Default user settings (will be merged)
scope: ./
modify: false
rules:
  - path: /progress/
    modify: true

# CORS configuration
cors:
  enabled: false
  credentials: false
  # allowed_headers:
  #   - Depth
  #   - Content-Type
  # allowed_hosts:
  #   - http://localhost:8000
  # allowed_methods:
  #   - GET
  #   - PROPFIND
  #   - MKCOL
  #   - DELETE
  #   - PUT
  # exposed_headers:
  #   - Content-Length
  #   - Content-Range
```

### 启动脚本 `WebDAV.cmd`

```cmd
@start "SimpleTextReader WebDAV" webdav.exe
```

### 目录结构：

- SimpleTextRead\
    - WebDAV.cmd
    - WebDAV.exe
    - config.yaml
    - index.html
    - books\
        - 分类1\
            - 小说1.txt
            - ...
        - 分类2\
            - 小说2.txt
            - ...
        - ...\
        - 未分类小说1.txt
        - 未分类小说2.txt
        - ...
    - css\
    - fonts\
    - images\
    - progress\
        - 小说1.txt.progress
        - 小说2.txt.progress
        - 未分类小说1.txt.progress
        - 未分类小说2.txt.progress
        - ...
    - scripts\


### 运行

1. 运行 WebDAV.cmd
2. 浏览器访问 http://localhost:8000/index.html
