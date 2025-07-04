---
created: 2009-03-26
share: true
---
# 为何要托管feed

1. 首先，第三方网站有着原始feed所不具有的、更多的扩展功能，比如自定义发布格式，加入各种新元素甚至插入广告。 

2. 方便统计订阅数。每当看到很多知名博客动辄上千上万的订阅数，不能不让人眼馋，而且，feed订阅数也非常有利于争取feedsky和Feedburner的广告。 

3. 节省流量。随便不能节省很多流量，但是对于部分小流量空间还是一定帮助的，有总比没有好吧。 

4. 更稳定的发布。对于很多博客新手来说，由于经常更换程序或是主题等等的不确定性，对feed发布和稳定性有一定的影响，而托管feed在这种情况下确实更有保障。 

以上这些并不是绝对的，原因见下文。 <!--more-->

# 托管feed的缺点

利用第三方来托管feed，比如使用feedsky或是feedburn还有有一定的缺陷的：

1. 让人又爱又恨的Feedburner。相信接触过feed的人都应该知道Feedburner，加上之前被google收购，很多收费的服务现在都免费了。更快的速度，更稳定的服务都让你爱。但是比较是国外服务，全英文的界面让很多人不适应，加之服务器在国外很容易被盾，加之之前的几次被封事件已经让人渐渐市区信心而转投feedsky了。 

2. 恨铁不成钢的feedsky。Feedsky是国内公司，被盾的可能性非常小（虽然因为低俗内容影响过一次域名绑定，但是很快就解决了），加之全中文界面适合国内用户，非常优秀的客服团队都让你喜欢。虽然Feedburner被封事件给feedsky带来了一个巨大的机遇，但是feedsky并没有像我们期望的那样成长起来，乌龟般的抓取速度，经常出错的统计结果等等都让人恨。 

# 我们该怎么选择？

恨完这些，我们到底该用Feedburner、Feedsky还是原始feed呢？博客联盟为我们写了篇文章《[feedburner，feedsky还是原始 feed？](http://blogunion.org/blogging-tips/feedsky-feedburner-or-original-feed.html)》 如果你选择了原始feed就不用继续阅读本文了，如果你选择了托管，欢迎继续阅读。 

不论你选择了Feedsky还是Feedburner，都会给你一个固定的feed地址，并不建议大家使用这个地址，而是使用自己的域名比如feed.jzoy.com，当托管的feed出现问题时，可以迅速转移并保留所有订阅者。月光博客就为我们介绍了[《在FeedSky和FeedBurner中无缝切换》](http://www.williamlong.info/archives/843.html)。 

# 关于域名格式

在你决定使用自定义域名绑定后，请切记使用一个固定的地址。显然feed.jzoy.com这样的域名格式非常合适，但是Feedburner的格式是feed.jzoy.com/jzoy。当你使用feed.jzoy.com而又想转到Feedburner的时候，很可能损伤一部分读者。当然方法是有的可能吧就为我们介绍了[《如何平滑地更换博客RSS Feed地址？》](http://www.kenengba.com/post/557.html)这个方法还是有一定缺点的，因为转向是在自己服务器上进行的，占用的是网站资源，所以Jzoy.com还是建议大家使用Feedburner的格式，因为feedsky同样支持feed.feedsky.com/Jzoy这种格式，前提是你在两个网站使用相同的feed名。 

当然你可能要问，如果我想使用Feedburner怎么办，众所周知Feedburner的域名绑定地址基本上是被封锁的。如果ping一下Feedburner所给的cname不难发现，他的ip地址其实和ghs.google.com是一样的，所以只需要将域名绑定到ghs.google.com即可。 

绑定ghs.google.com的方法网上有很多，这里也给大家提供一个便捷的方法，就是将域名绑定到TanCee提供的镜像地址google.dns.tancee.com，具体介绍请看[《CHS》](http://blog.tancee.com/ghs) 看到这里，你应该有个决定了，分享下你的feed吧！