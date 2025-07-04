---
created: 2020-04-20
share: true
---
![Pasted image 20231119224436](https://img.xcz.life/i/archive/obsidian/1741526939-b4.png)
# 背景

一直以来都想为公司搭建一个团队共享的知识库，尝试过很多解决方案，到今天终于有了一个比较靠谱的方案了，先给大家介绍下自己趟过的坑吧~

 1. [优雅的Flarum轻论坛](https://flarum.org/)：类似的方案其实有很多，包括[修罗轻论坛](https://bbs.xiuno.com/)，不过论坛毕竟是论坛，功能定位和知识库还是不一样，我需要一个有权限管理，可以发布体系化内容的程序。

 2. 各种共享笔记：自己平时工作一直用Onenote，真的是笔记利器，绝对的生产力工具，在Onenote基础上，尝试了[OneNote Staff Notebook](https://www.onenote.com/STAFFNOTEBOOKEDU)，微软提供的团队版Onenote，无奈同步问题和需要客户端组织了我很多的小伙伴。同类型的产品还有为知笔记、有道云笔记等等。

 3. 在线文档：非常喜欢阿里提供的[语雀](https://www.yuque.com/)，不过企业空间需要5999元/年，[看云文档](https://www.kancloud.cn/)和开源软件[ShowDoc](https://www.showdoc.cc/)，价格倒是很便宜，不过使用上有些Geek了，还是阻挡了我的小伙伴。

 4. Wiki软件：后来有人推荐开源的维基程序，尤其是[DokuWiki](https://www.dokuwiki.org/)和[MediaWiki](https://www.mediawiki.org/)，到这里我就很推荐DokuWiki了，搭建简单，不需要数据库，备份迁移都非常的方便，使用上，看看官方文档，设置下权限，很容易就搭建出来了。

 5. [Bookstack](https://www.bookstackapp.com/)：直到最后发现了Bookstack这个神器，刚开始Bookstack对中文的支持并不好，断断续续看到Github上一直在更新，就尝试了一下，发现真的是现代版的DokuWiki啊，内容管理太方便了，权限管理特别方便，还有自动清理功能，查找不使用的图片自动删除，太贴心了有没有。

今天就详细给大家做一个新手教程，展示下如何利用traefik和Docker**快速无痛**搭建Bookstack知识库网站！
<!--more-->
# 准备工作

## 服务器选择

之前一直用的是[阿里云服务器](https://promotion.aliyun.com/ntms/yunparter/invite.html?userCode=t4t58cng)，后来[腾讯云](https://curl.qcloud.com/VGHtimyB)，最近一直有88元1年的服务器，非常适合小团队使用，需要的小伙伴可以点[这个链接](https://cloud.tencent.com/act/cps/redirect?redirect=1050&cps_key=890cdfbc5953be8bca76097ab8151b7f&from=console)。

## 安装系统

由于系统最终借助Docker技术，主机的操作系统其实没有什么限制，只要能正常运行Docker即可，选择大家熟悉的系统就好，这里我选的是Ubuntu，主要是由于用的比较顺手哈哈。
![Pasted image 20231119224445](https://img.xcz.life/i/archive/obsidian/1741526939-c4.png)
安装好系统后，先更新一下，使用如下命令：
``` bash
sudo apt update
sudo apt upgrade
```

## 安装Docker

详细的安装教程可以查看官方网站：[Docker Docks](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
![Pasted image 20231119224451](https://img.xcz.life/i/archive/obsidian/1741526939-5b.png)
另外，如果不是云服务器安装的话，建议使用国内的镜像，比如[中科大的源](https://mirrors.ustc.edu.cn/help/docker-ce.html)，速度会快很多，方法也很简单，只要把 `download.docker.com` 地址换成 `mirrors.ustc.edu.cn/docker-ce` 即可。

## 安装`docker-compose`

为了方便部署Docker镜像，我们这里采用Docker-Compose的方式，执行如下命令即可：

``` bash
sudo apt install docker-compose
```

到这里，准备工作就基本完成啦，下面就要进入最重要的环节了。

# 安装程序Bookstack

配置好环境后，就需要编写`docker-compse.yml`文件了，具体命令如下：

``` bash
mkdir bookstack
cd bookstack
touch docker-compose.yml
nano docker-compose.yml
```
上面的命令依次是新建一个名为`bookstack`的文件夹，转至`bookstack`文件夹，新建一个名为`docker-compose.yml`的文件，用`nano`编辑器打开`docker-compose.yml`文件。

修改好下方的代码，粘贴到`docker-compose.yml`文件中。

```yml
version: "3.3"

services:

  traefik:
    image: "traefik:latest"
    container_name: "traefik"
    command:
      - "--log.level=DEBUG" # 测试环境下使用
      - "--api=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory" # 测试环境下使用
      - "--certificatesresolvers.mytlschallenge.acme.email=admin@gmail.com"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    labels:
      - "traefik.enable=true"
      # Traefik面板
      - "traefik.http.routers.traefik.rule=Host(`traefik.example.org`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.middlewares=authtraefik"
      - "traefik.http.middlewares.authtraefik.basicauth.users=user:$$apr1$$ATuYWcmO$$dUOXryh1xC00cNO3KEHZ30" # user/password
      # 全局跳转至https
      - "traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)"
      - "traefik.http.routers.http-catchall.entrypoints=web"
      - "traefik.http.routers.http-catchall.middlewares=redirect-to-https@docker"
      # 跳转中间件
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
    volumes:
      - "./traefik/letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    restart: unless-stopped


  bookstack:
    image: linuxserver/bookstack
    container_name: bookstack
    environment:
      - PUID=1000
      - PGID=1000
      - DB_HOST=bookstack_db
      - DB_USER=bookstack
      - DB_PASS=password
      - DB_DATABASE=bookstackapp
      - APP_LANG=zh_CN
      - APP_URL=https://help.example.org
      - WKHTMLTOPDF=/usr/bin/wkhtmltopdf
      # Mail Setting
      - MAIL_DRIVER=smtp
      - MAIL_FROM=service@example.com
      - MAIL_FROM_NAME="XXXX知识库"
      # SMTP mail options
      - MAIL_HOST=smtpdm.aliyun.com
      - MAIL_PORT=465
      - MAIL_USERNAME=service@example.com
      - MAIL_PASSWORD=password
      - MAIL_ENCRYPTION=ssl
    volumes:
      - ./bookstack:/config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.bookstack.rule=Host(`help.example.org`)"
      - "traefik.http.routers.bookstack.entrypoints=websecure"
      - "traefik.http.routers.bookstack.tls=true"
      - "traefik.http.routers.bookstack.tls.certresolver=mytlschallenge"
    restart: unless-stopped
    depends_on:
      - bookstack_db
  bookstack_db:
    image: linuxserver/mariadb
    container_name: bookstack_db
    environment:
      - PUID=1000
      - PGID=1000
      - MYSQL_ROOT_PASSWORD=yourdbpass
      - TZ=Asia/Shanghai
      - MYSQL_DATABASE=bookstackapp
      - MYSQL_USER=bookstack
      - MYSQL_PASSWORD=password
    volumes:
      - ./mariadb:/config
    restart: unless-stopped
```

粘贴完毕后，根据服务器的情况修改配置后，按`Ctrl + X`,然后输入`y`后，按回车，退出程序。

输入`docker-compose up`命令后，程序会自动拉去镜像，配置完成后，就可以访问啦。

## `docker-compose.yml`文件说明

## `compose`文件版本

``` yml
version: "3.3"

services:
```

这里定义的是`docker-compose.yml`文件的版本，目前最新的是3.X版本，大家可以根据自己的使用的代码更新，详细的可以查看[官方说明](https://docs.docker.com/compose/compose-file/compose-versioning/)。

## 配置HTTPS访问

`traefik`有一个特别棒的功能就是可以自动申请Let'sencrypt的SSL证书，只需要加入下方的代码。

```yml
    command:
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory" # 测试环境下使用
      - "--certificatesresolvers.mytlschallenge.acme.email=admin@gmail.com"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
```

这里采用的是`tlschallenge`方式，把上面的`admin@gmail.com`修改成自己的邮箱即可。

需要注意的是，测试环境下，一定不要反复的去重新安装或者更换服务器，Let’sencrypty一周内申请证书的次数是有限制的，超过限制后，`traefik`申请的证书就不被浏览器认可了。当开启debug模式后，会输出如下代码：

```bash
traefik         | time="2019-11-17T13:27:52Z" level=error msg="Unable to obtain ACME certificate for domains \"traefik.example.org\": unable to generate a certificate for the domains [traefik.example.org]: acme: error: 429 :: POST :: https://acme-v02.api.letsencrypt.org/acme/new-order :: urn:ietf:params:acme:error:rateLimited :: Error creating new order :: too many certificates already issued for exact set of domains: traefik.example.org: see https://letsencrypt.org/docs/rate-limits/, url: " providerName=mytlschallenge.acme routerName=traefik rule="Host(`traefik.example.org`)"
```

大家可以去 https://crt.sh/ 这个网站查看自己的域名，会显示一共申请了多少个证书。

当测试好代码后，切换到生产环境时，就可以把下面这行代码注释或者删除了。

```yml
    #  - "--certificatesresolvers.mytlschallenge.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory" # 测试环境下使用
```


## 密码保护`traefik`面板

`traefik`提供了一个非常直观的面板，我们可以通过下方的代码，为面板加密。

```yml
    labels:
      - "traefik.enable=true"
      # Traefik面板
      - "traefik.http.routers.traefik.rule=Host(`traefik.example.org`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.middlewares=authtraefik"
      - "traefik.http.middlewares.authtraefik.basicauth.users=user:$$apr1$$ATuYWcmO$$dUOXryh1xC00cNO3KEHZ30" # user/password
```
上面的代码意思是，通过`traefik.example.org`域名访问`traefik`面板，并使用`https`协议，访问时需要输入用户名（user）和密码（password）。

密码生成的方式很简单，针对Ubuntu服务器，先安装`apache2-utils`或者`mini-httpd`，然后使用htpasswd命令即可，代码如下：

```bash
sudo apt-get install apache2-utils
echo $(htpasswd -nb user password) | sed -e s/\\$/\\$\\$/g
```
服务器返回的字段`user:$$apr1$$ATuYWcmO$$dUOXryh1xC00cNO3KEHZ30`就是加密过后的账号密码啦。


## 自动跳转到https

这个也是我非常喜欢`traefik`的一个原因，可以通过简单的配置就实现自动跳转到https网址，再也不用去摸索nginx的配置文件了！！！

```yml
      # 全局跳转至https
      - "traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)"
      - "traefik.http.routers.http-catchall.entrypoints=web"
      - "traefik.http.routers.http-catchall.middlewares=redirect-to-https@docker"
      # 跳转中间件
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
```

## 配置Bookstack邮件服务器

这里再次安利一下[阿里云服务器](https://promotion.aliyun.com/ntms/yunparter/invite.html?userCode=t4t58cng)，邮件推送服务每天有200封免费额度，足够我们这些小网站使用了，配置也特别简单，只需要在文件中加入：

```yml
      # Mail Setting
      - MAIL_DRIVER=smtp  # 发信协议
      - MAIL_FROM=service@example.com  # 发信邮箱
      - MAIL_FROM_NAME="XXXX知识库"  #发信人名称
      # SMTP mail options
      - MAIL_HOST=smtpdm.aliyun.com  # 发信服务器地址
      - MAIL_PORT=465  # 端口
      - MAIL_USERNAME=service@example.com  # 发信邮箱地址
      - MAIL_PASSWORD=password  # 密码
      - MAIL_ENCRYPTION=ssl  # 协议
```

# 其他

## `wkhtmltopdf`问题

目前Bookstack使用下来，一直有一个bug没有解决，就是docker环境下，无法正常使用wkhtmltopdf导出中文字体，一开始以为是Bookstack的bug，在官方提交了[issue](https://github.com/BookStackApp/BookStack/issues/1778)，后来经过大神点拨，发现可能是docker环境下的问题，又去了linuxserver上提交了[issue](https://github.com/linuxserver/docker-bookstack/issues/50)。

## 中文翻译问题

目前Bookstack还有很多地方没有翻译，查看了代码，就抽空做了一点点的翻译，也给作者提交了，希望可以尽快被接受，也算是为开源社区做贡献了。

着急的朋友可以下载的文件，或者自己翻译，Github的地址是https://github.com/jzoy/BookStack，找到`/resources/lang/`文件夹，把里面的`zh_CN`文件夹上传到服务器中，使用`docker ps`命令查找docker实例的id，输入如下命令：

```bash
sudo docker cp /home/ubuntu/zh_CN cd487e6a0260:/var/www/html/resources/lang
```

上述代码中，`cd487e6a0260`就是bookstack的实例id，`/home/ubuntu/zh_CN`是上传的翻译文件路径，`/var/www/html/resources/lang`则是docker中对应翻译文件存放的路径，不知道到的小伙伴可以用下方的代码，连接到docker实例中，用`ls`命令查找，然后用`pwd`命令输出当前位置后复制即可。

```bash
sudo docker exec -it cd487e6a0260 /bin/bash
```

当然，这只是一个临时性的方案，如果重新下载镜像，则会覆盖本地的翻译，各位小伙伴要注意。

## 修改文件上传限制

Bookstack默认的文件上传大小是1mb，修改这个限制也很简单，进入程序安装目录，进入`bookstack/bookstack/php`目录，修改`php-local.ini`文件成如下内容：

```php.ini
; Edit this file to override php.ini directives and restart the container

date.timezone = Asia/Shanghai
post_max_size = 20M
upload_max_filesize = 20M
```
上面的20M就是上传文件的限制，大家可以根据需要修改。


## 网站备份

网站备份的方式有很多，可以用SFTP客户端进行，不过很可能会遇到权限问题，毕竟备份资料中有数据库文件，还有log文件。还推荐使用rsync的方式，代码如下：

```bash
rsync -zaP --rsync-path="sudo rsync"  --delete ubuntu@site.com:/home/ubuntu/bookstack/ /home/mac/bookstack
```
上面这段代码是单向备份，如果服务器上删除内容，本地也会自动删除。将`ubuntu@site.com`替换成自己的服务器用户名和地址，`/home/mac/bookstack`替换成要存储的文件夹位置即可。

# 参考资料

traefik官方文档：[➥➥](https://docs.traefik.io/user-guides/docker-compose/acme-tls/) 

Traefik 2.0 & Docker 101：[➥➥](https://blog.containo.us/traefik-2-0-docker-101-fc2893944b9d)

wkhtmltopdf安装：[➥➥](https://www.odoo.com/zh_CN/forum/help-1/question/ubuntu-18-04-lts-how-to-install-wkhtmltopdf-0-12-1-recommended-for-odoo-9-0-and-lower-134198)

wkhtmltopdf中文显示空白的问题：[➥➥](http://www.kpt6.com/?p=35)

Setting up a Reverse-Proxy with Nginx and docker-compose：[➥➥](https://www.domysee.com/blogposts/reverse-proxy-nginx-docker-compose)

Traefik v2 and Mastodon, a wonderful couple! [➥➥](https://www.innoq.com/en/blog/traefik-v2-and-mastodon/)