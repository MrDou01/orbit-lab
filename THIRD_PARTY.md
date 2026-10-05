# 第三方组件

## Three.js

- 项目：[mrdoob/three.js](https://github.com/mrdoob/three.js)
- 固定版本：**0.180.0 / r180**
- 上游版本：[r180 发布记录](https://github.com/mrdoob/three.js/releases/tag/r180)
- 上游文件：[three.module.min.js](https://github.com/mrdoob/three.js/blob/r180/build/three.module.min.js)、[three.core.min.js](https://github.com/mrdoob/three.js/blob/r180/build/three.core.min.js)
- 本地文件：`vendor/three.module.min.js`、`vendor/three.core.min.js`
- 许可证：MIT；原始许可证保留于 `vendor/THREE-LICENSE.txt`，上游见 [r180/LICENSE](https://github.com/mrdoob/three.js/blob/r180/LICENSE)。

Three.js 用于页面的实时 3D 渲染。组件随网站提供，因此访问页面不依赖第三方 JavaScript CDN。

## GitHub Actions

部署工作流引用 GitHub 维护的 [checkout](https://github.com/actions/checkout)、[configure-pages](https://github.com/actions/configure-pages)、[upload-pages-artifact](https://github.com/actions/upload-pages-artifact) 和 [deploy-pages](https://github.com/actions/deploy-pages)。它们在 GitHub 的部署环境中运行，不作为浏览器脚本分发；对应许可证以各上游仓库为准。
