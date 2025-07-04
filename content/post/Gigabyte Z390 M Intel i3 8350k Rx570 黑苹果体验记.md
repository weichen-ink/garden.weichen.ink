---
created: 2019-08-19
share: true
---
![Pasted image 20231119223120](https://img.xcz.life/i/archive/obsidian/1741526899-4a.png)

# 背景

还记得乔布斯在舞台上从牛皮纸档案袋中抽出一台Macbook Air惊艳全场，到一个月后在实体店看到真机，肉眼看到还是觉得薄的不可思议，拿起来感觉像玩具。后来读研期间拿着自己的公司败了一台高配Macbook Air真的是喜欢的不得了。后来由于工作需要换了Thinkpad，但是一直很怀念苹果的系统。

偶然间看到油管大神提到 [Vanilla](https://hackintosh.gitbook.io/-r-hackintosh-vanilla-desktop-guide/) 安装方法，可以保持系统的纯洁的同时，极大降低的黑苹果安装的难度，摩拳擦掌就准备试试，经过差不多2周时间的折腾，就有了今天这篇体验记了。如今网上已经有大量的黑苹果教程了，这里就不重复造轮子了，只把自己的一些体验和坑记录下来，给想Hackintosh的朋友一点点帮助。


<!--more-->


# 准备

虽然有新的Vanilla安装方法，但是黑苹果对于新手还是有一定难度的，哪怕你用完全一模一样的硬件，也会有一些坑，一旦碰到，就会让整个安装停住，特别折磨人。这里给大家几个建议：

 1. 如果是笔记本想装黑苹果，那就直接谷歌去搜索一下教程吧，如果有完美配置，或者有大神已经实现，那就可以尝试，否则，还是非常不推荐新手去折腾的。另外Github上有很多人搜集了常见笔记本的EFI文件，可以去下载尝试。
 2. 台式机一定要去tonymacx86.com或者远景查一下，自己的主板是否支持，是否有别人的成功经验，能找到越多越好。
 3. 如果现有设备不支持，非常推荐大家去按照网上推荐的清单组一台新的，基本上能做到非常完美的体验。

# 安装

安装比较推荐用 [Vanilla](https://hackintosh.gitbook.io/-r-hackintosh-vanilla-desktop-guide/) ，方法也很简单。

 1. 有Mac系统的朋友，只要去AppStore下载一个Mojave最新的系统盘。我遇到的第一个问题就是下载速度太慢，从电信换了公司的联通宽带就解决了，大家也可以尝试换个地方或者挂代理，镜像文件都在6GB以上，小水管真的等不起。

 2. 没有Mac系统的朋友，可以下载Vmware，用一个Python的脚本，让软件支持Mac Os系统，安装后就可以下载了。

 3. 用Mac自带的磁盘工具，格式化磁盘，名称写 INSTALLER ，格式选 OS X扩展（日志式），方案选 GUID分区图。

 4. 抹掉后，打开终端输入如下命令

```shell
sudo /Applications/Install\ macOS\ Mojave.app/Contents/Resources/createinstallmedia --volume /Volumes/INSTALLER /Applications/Install\ macOS\ Mojave.app --nointeraction
```

下载Clover Installer和Clover，从这里开始，推荐大家按照已经有的比较成熟的教程配置自己的主板，安装clover指定的插件，文末也会给大家推荐几个比较好的教程。

![Pasted image 20231119223130](https://img.xcz.life/i/archive/obsidian/1741526899-d7.png)

![Pasted image 20231119223135](https://img.xcz.life/i/archive/obsidian/1741526899-70.png)

其中Clover安装时，建议选择上述图片中的文件，其中为了解决OsxAptioFixDrv: AllocateRelocBlock Error问题，安装了Test2-2016.efi文件，具体教程见：https://nickwoodhams.com/x99-hackintosh-osxaptiofixdrv-allocaterelocblock-error-update/
![Pasted image 20231119223145](https://img.xcz.life/i/archive/obsidian/1741526899-10.png)
完成安装后，一定要选尽可能接近自己电脑的型号，这样才能保证后期完美运行。当所有的配置都完成后，重启一下，就可以获得一个完美的黑苹果啦~

# 体验

 1. 如果初期就按照tonymacx86推荐的配置来选择，基本上体验就是完美的，包括与苹果各种设备之间的联系。
 2. 本人的设备唯一不完美的地方，就是偶尔有几率，启动会失败，重启一下就可以了，实在是懒得折腾了哈哈。
 3. 接上条，黑苹果真的是一件非常考验耐心的事情，当然也有非常多的乐趣，如果时间允许，预算有限，还是推荐大家折腾一下，最终体验很不错。
 4. 苹果的很多生产工具（效率软件）还是很给力的，比如Ominifocus，真的很难有好的替代品，很多苹果系统下的软件默认的模板就很漂亮，做出来的东西也很特别，这一点是加分项。
 5. 但是话说回来，苹果系统的很多缺点，也确实让人抓狂，最受不了的就是鸡肋的访达，文件查找和管理真的很崩溃。

# 结论

经过三个月的体验，我又买了个硬盘，做了双系统，目前绝大部分的时间是在Windows下，主要是追求兼容性，团队内部Mac系统很少，又需要经常做Word和PPT的方案，不能有一点偏差，因此还是要屈服Windows的市场占有率啊。

# 资源推荐

 1. 虚拟Mac系统安装教程：[➥➥](https://www.feiniaomy.com/post/257.html) 
 2. 黑苹果安装教程1：[➥➥](https://www.zmczx.com/t/76)  
 3. 黑苹果安装教程2：[➥➥](https://www.reddit.com/r/hackintosh/comments/as3jd8/mojave_10143_gigabyte_z390_m_gaming_intel_i5/)