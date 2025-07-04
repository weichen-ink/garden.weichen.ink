---
created: 2020-10-17
share: true
---
# 背景

你现在看到的小博客，经历了太多次的折腾和蜕变，从2008年最早的[[折腾记]],到最后一次切换 [[你好世界，这是我新的开始！|hexo]]，今天，她再次切换到了新的平台😂。

没错，新的平台就是Hugo，号称世界上最快的静态网站生成器。之前一直用[Hexo](https://hexo.io/zh-cn/)，网站本来文章就不多，所以速度慢点也可以忍，但是最迈不过去的坎是node的各种包...

博主本来就是IT小白，纯靠爱好和网上的野教程瞎折腾，每当一段时间不更包，或者换电脑重新从github拉取，就会出现满屏的错误，而且Next主题也超级勤奋，前段时间从版本7升级到8，各种配置都要重新核对一遍，折腾到这里就索性换了[Hugo](https://gohugo.io/)。

# Hexo和Hugo的使用体验

这里先总结一下两款平台的优缺点还有使用感受：

## Hexo

1. Hexo的中文化要好过其他所有平台，有大量国人设计制作的主题，字体和设计风格都非常符合中国人的审美。

2. Hexo主题基本上都支持搜索功能，自带文章目录。

3. 基于Javascript，使用上会比Hugo要复杂一些。

## Hugo

1. 基于Go语言，安装升级简单，一个exe文件即可运行。

2. 页面生成速度快，真的要快好多哈哈。

3. 代码相对简单，主题设计容易上手，基本上对着官方的教程就可以跑起来。

4. 中文化较差，中文文档不全，搜索功能比较难实现。

两款软件其实很早就都体验过了，最终我选择用Hugo来重建“思想志”博客，毕竟所有文章都已经用markdown来保存了，迁移起来非常容易。


# 设计主题

用上Hugo之后，就在Google上各种搜索教程，也看了油管上的视频教程。汇总了各位大佬的教程，结合各种Tips，最终折腾出了这么一个超级“简单”的主题，目前只用了Css的@media来实现响应式，不过缩放还是有点奇怪。

这里展示一下博客页面的设计：

1. 首页截图

![Pasted image 20231119224621](https://img.xcz.life/i/archive/obsidian/1741527199-83.png)

2. 博客页面截图

![Pasted image 20231119224627](https://img.xcz.life/i/archive/obsidian/1741527199-4a.png)

3. 标签页面截图

![Pasted image 20231119224634](https://img.xcz.life/i/archive/obsidian/1741527199-11.png)



# 经验总结

1. 成功离不开每一步的脚踏实地。想做成一件事情，有可能需要很漫长的努力和投入，这次折腾主题，就发现自己非常的心浮气躁，各种“嫌烦”。以后工作一定要尝试目标分解，做好规划，完成具体的项目时，就只看当前的任务要求，不要去想着其他任务，避免焦虑感。

2. 初次接触全新领域时，一定要做好过程记录，尤其在资料搜集阶段，做好记录，再你回看时，或者遇到困难，发现并不能重现教程中的效果时，可以复盘查看，很多时候是由于自己过于求成，忽视了文章中的细节。



# 后续计划

- 添加并优化SEO功能
- 精简优化重复的代码
- 添加本地搜索功能
- 添加侧边栏目录

