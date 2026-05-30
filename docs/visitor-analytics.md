# Visitor analytics for zhenghui.fun

## 当前公开展示：国家级访客地图

首页的 `Visitor Countries` 区块使用 Netlify Edge Function 读取访问者国家代码，并通过 Netlify Blobs 保存聚合数据。

当前实现只保存：

- 国家/地区代码。
- 国家/地区名称。
- 聚合访问次数。
- 首次和最近一次出现时间。
- 最近 180 天的国家级日汇总。

当前实现不保存：

- IP 地址。
- 城市。
- 经纬度。
- 浏览器指纹。
- 单个访客访问路径。

相关文件：

- `content/home/visitor-countries.md`
- `netlify/edge-functions/visitor-countries.js`
- `static/js/visitor-countries.js`
- `static/uploads/nrlab/world-countries-110m.geojson`

## Netlify Web Analytics

当前 `zhenghui.fun` 指向 `zhenghui.netlify.app`，站点由 Netlify 托管。要在后台看更完整的访问页面、独立访客和来源，可以继续使用 Netlify 自带的 Web Analytics。

打开方式：

1. 登录 Netlify。
2. 进入站点 `zhenghui`。
3. 打开 `Logs & Metrics` -> `Analytics`。
4. 点击 `Enable Analytics`。

开启后可以看到：

- Pageviews：页面访问次数。
- Unique visitors：按 IP 统计的独立访客。
- Top locations：访问来源地图和地区表。
- Top pages：被访问最多的页面。

Netlify 官方说明：

- https://docs.netlify.com/manage/monitoring/project-analytics/overview/
- https://docs.netlify.com/manage/monitoring/web-analytics/how-web-analytics-works/

## 如果需要原始 IP 明细

原始 IP 不适合放在公开网页上，也不在当前国家级访客地图中保存。更合适的方式是 Netlify Log Drains，把站点访问日志导出到 Axiom、Datadog、New Relic 等日志平台，再在后台查看 `client_ip`、`country`、`path`、`user_agent`、访问时间等字段。

Netlify 官方说明：

- https://docs.netlify.com/manage/monitoring/log-drains/

如果后续启用原始 IP 日志，需要同时明确：

- 谁可以访问日志后台。
- 日志保存多久。
- 是否需要在隐私政策中说明会记录 IP、User-Agent、访问页面和访问时间。

## 不建议做的事

不要把访客 IP 列表或访问明细直接展示在 NRLab 公开网站上。这会把访客个人信息公开出来，也会让实验室主页显得不专业。
