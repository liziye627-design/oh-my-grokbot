# 开源实现参考

核对日期：2026-10-15。只引用官方仓库/文档，本包未复制源码、未打包二进制、未自动安装这些工具。

| 项目 | 用途 | 许可与适配决策 |
| --- | --- | --- |
| [FFmpeg](https://github.com/FFmpeg/FFmpeg) | 原生宿主上的转码、剪辑、媒体检查 | [官方 LICENSE](https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md)：基础通常 LGPL-2.1-or-later，启用 GPL 组件或外部库会改变构建许可，nonfree 构建不可按普通可再分发构建处理。执行前记录本机版本/配置/许可证，不能笼统标为 MIT。 |
| [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | 编辑时间线交换格式候选，后续跨编辑器对接 | [Apache-2.0](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/LICENSE.txt)。当前使用可审阅 storyboard CSV；未声称已实现 OTIO adapter，也不把时间线文件视为已渲染成片。 |
| [video-use](https://github.com/browser-use/video-use) | 可选本地剪辑 CLI | MIT。注册表 reference；缺失不算成片。 |
| [remotion](https://github.com/remotion-dev/remotion) | 可编程视频参考 | 自定义许可，较大营利组织可能需要企业许可证。只保留链接，不复制、不打包。 |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | 本地图像或视频图运行时参考 | GPL-3.0。不复制源码；单独安装的本地实例须记录版本和许可。 |

[ffprobe 官方文档](https://ffmpeg.org/ffprobe.html) 支持 JSON 输出及 format/stream 信息。验收建议针对真实本地输入执行 `ffprobe -v error -show_format -show_streams -of json <actual-file>`，保存输出和返回码。这不会自动验证字幕可读性、音画同步或素材授权，仍需人工/独立验收者检查。

以上是检索时的上游引用，未做发布版本或提交锁定。后续安装时应固定具体发行版、下载来源和校验值，再纳入 upstream lock。新增工具是注册表引用，不会安装进发行包。
