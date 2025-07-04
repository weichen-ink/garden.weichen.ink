---
created: 2019-11-29
share: true
---
![Pasted image 20231119223043](https://img.xcz.life/i/archive/obsidian/1741527353-39.png)
自从博客从Wordpree换成了Hexo，主机也从万网的虚拟主机换成了[腾讯的云服务器](https://cloud.tencent.com/redirect.php?redirect=1034&cps_key=890cdfbc5953be8bca76097ab8151b7f&from=console)，就一直在折腾GitHub和Hexo相关的内容，这里就把常用的命令和技巧，做一个汇总。

# GitHub篇

## Windows平台安装

Windows平台GitHub的安装非常简单，只需要去[Git官方网站](https://git-scm.com/)下载安装即可，对于新手用户，可以一路“下一步”哈哈。

<!--more-->

## 创建SSH Key免密码同步

每次Git拉取或同步是都要输密码是一件非常痛苦的事情，我们可以通过创建一个SSH Key来实现免密访问。

```bash
ssh-keygen -t ed25519 -C "jzoy@qq.com"

# 请把引号中的邮箱换成自己GitHub绑定邮箱
```

打开资源管理器，访问 `C:\Users\jzoy\.ssh`目录（这里的`jzoy`要换成电脑的用户名，用记事本或任意代码编辑器打开`id_ed25519.pub`文件并复制内容。
![GitHub-ssh-1](https://img.xcz.life/i/archive/obsidian/1741527353-21.png)


如果找不到这个文件，请把资源管理器`查看`标签页下的`隐藏的项目`勾选。

![GitHub-ssh-2](https://img.xcz.life/i/archive/obsidian/1741527353-62.png)


登录GitHub系统后点击右上角账号头像后的“▼”标志，依次点击`Settings`、`SSH and GPG keys`、`New SSH key`，粘贴刚才复制的内容后保存即可。


## 本地Git设置

### 设置用户名和邮箱

```bash
git config --global user.name "your name"
git config --global user.email "your_email@youremail.com"
```

### 添加远程仓库

```bash
git remote add origin https://github.com/jzoy/jzoy.com
```

### 克隆指定分支

Git的clone命令相信大家都很熟悉，在clone时我们可以指定分支，具体命令如下：

```bash
git clone -b dev https://github.com/jzoy/jzoy.com
```

上述命令会自动克隆`dev`分支的数据

### 克隆到指定位置

```bash
git clone https://github.com/jzoy/jzoy.com www/wwwroot/
```

克隆远程仓库文件到`www/wwwroot/`位置。

### 克隆后改名 

```bash
git clone https://github.com/jzoy/jzoy.com Jzoy
```
上述命令会自动把远程仓库的文件拉取到Jzoy文件夹中。


### 退回并删除Github提交记录

首先要清除所有待提交的文件，查找想退回的commit id

```bash
git log  #查看提交记录
git reset --soft HEAD^ #恢复到指定的版本
```

恢复所有修改文件后，通过如下命令覆盖Github提交记录

```bash
git push origin +branchName --force
```