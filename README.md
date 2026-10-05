# ORBIT LAB

[在线体验](https://mrdou01.github.io/orbit-lab/) · [GitHub 仓库](https://github.com/MrDou01/orbit-lab)

一个以实时图形、动态排版和交互实验为核心的视觉网站。使用 GitHub 上的开源 Three.js 与原生 HTML、CSS、JavaScript 构建，支持 GitHub Pages。

## 双击即看

先运行 `npm run package`，然后双击 `assets/orbit-lab-standalone.html`。三维引擎、样式、动态作品和源码下载均已嵌入，不需要启动服务，也可复制到其他电脑使用。

项目根目录包含全部可编辑源码。重新打包后，完整源码包位于 `assets/orbit-lab-source.zip`。

## 本地开发预览

安装 Node.js 后，在项目目录运行：

```sh
npm run dev
```

浏览器访问 [本地预览](http://127.0.0.1:4173)。无需安装依赖。请用本地服务打开源文件 `index.html`；双击即看请使用上面的独立网页。

## 重新打包

修改源码后运行 `npm run package`，生成 `assets/orbit-lab-source.zip` 和 `assets/orbit-lab-standalone.html`。源码 ZIP 不递归包含自身。GitHub Pages 工作流会在发布前重新打包，保证下载按钮可用。

## 发布到 GitHub Pages

1. 在 GitHub 创建公开仓库，例如 `orbit-lab`。
2. 将项目文件上传到 `main` 分支，确保 `index.html` 位于仓库根目录，并包含 `.github/workflows/pages.yml`。可通过 GitHub Desktop 或 Git 上传。
3. 进入 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
4. 打开 **Actions → Deploy ORBIT LAB to Pages → Run workflow**，运行 `main` 分支。以后每次推送自动更新。
5. 从部署记录或 **Settings → Pages** 打开发布地址，通常为 `https://你的用户名.github.io/orbit-lab/`。

所有网站资源使用相对路径，支持项目仓库子路径。若分支名不是 `main`，请同步修改工作流。

官方说明：[添加本地项目](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github) · [自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 文件说明

| 文件 | 内容 |
| --- | --- |
| `index.html` | 页面内容与结构 |
| `styles.css` | 布局、配色与响应式样式 |
| `app.js` | 页面交互 |
| `scene.js` | 三维雕塑与交互 |
| `gallery-art.js` | 三组生成艺术 |
| `server.mjs` | 无依赖本地预览服务 |
| `package.mjs` | 无依赖 ZIP 与独立网页打包 |
| `assets/` | 图形资源、自动生成的交付文件 |
| `vendor/` | Three.js 与其许可证 |
| `.github/workflows/pages.yml` | GitHub Pages 自动部署 |

## 操作与兼容性

- 主视觉：拖动旋转；选中画布后，方向键旋转、数字 1–3 切换模式、空格暂停。
- 展开按钮可拆分雕塑；重置按钮恢复初始视角。
- 点击展廊作品放大预览，按 Esc 关闭。
- 暂停按钮控制动态效果，首次进入遵循系统的“减少动态效果”设置。
- 支持现代桌面与移动浏览器；WebGL 不可用时显示静态雕塑预览。

原创代码采用 [MIT 许可证](LICENSE)。第三方来源见 [THIRD_PARTY.md](THIRD_PARTY.md)。ORBIT LAB 是独立演示项目，与 GitHub 或 Three.js 官方无隶属关系。
