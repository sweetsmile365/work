# Family Schedule Hub

家庭私用版日程管理 PWA。第一版重点是可运行、可在手机/iPad/PC 使用、支持日语 OCR 候选导入、路线/巴士时间维护、冲突检查和备份导出。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。首次部署前必须设置下面的家族登录环境变量；未配置时，登录与云端同步会明确拒绝，不再使用浏览器内的默认密码。

## Supabase

1. 创建 Supabase Project。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 执行 `supabase/seed.sql`。
4. 创建 Storage buckets，均设为 private：
   - `import-files`
   - `backup-files`
5. 在 Supabase Auth Dashboard 创建三个邮箱密码用户：
   - `mom@example.com`：妈妈/admin
   - `dad@example.com`：爸爸/parent
   - `child@example.com`：孩子/child_editor
6. 将真实 `auth.users.id` 更新到 `profiles.id` 和 `family_members.profile_id`，或按真实 id 重新插入 seed 数据。

Auth Redirect URLs：

```text
http://localhost:3000/**
https://你的-vercel-domain/**
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FAMILY_SYNC_ID=family-schedule-hub
FAMILY_SESSION_SECRET=
FAMILY_ADMIN_PASSWORD=
FAMILY_PARENT_PASSWORD=
FAMILY_CHILD_EDITOR_PASSWORD=
FAMILY_DISPLAY_TOKEN=
OCR_PROVIDER=google
GOOGLE_CLOUD_VISION_API_KEY=
```

`FAMILY_SESSION_SECRET` 和 `FAMILY_DISPLAY_TOKEN` 请使用至少 32 字符的随机字符串。三个角色密码至少设置为 8 个字符且互不相同。不要提交真实 key，也不要创建 `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` 或 `NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY`。

首次登录后，管理者可在「パスワード設定」中修改三个角色的密码；修改后的摘要只保存在云端状态中，不会发送到浏览器。环境变量里的初始密码只在对应角色尚未设置云端密码时使用。

大屏幕使用 `/display#displayToken=FAMILY_DISPLAY_TOKEN` 打开一次即可建立只读会话；令牌放在 URL 片段中，不会随页面请求发送到服务器。显示页面只能读取日程，不能调用保存接口。

## OCR

Google Cloud Console 中启用 Cloud Vision API，创建 API Key，并在本地/Vercel 设置 `GOOGLE_CLOUD_VISION_API_KEY`。未配置 key 时，`/api/ocr/image` 和 `/api/ocr/pdf` 自动返回 mock OCR 文本，并在 Import Inbox 中生成候选项。

OCR 结果不会自动进入正式日历，必须由 admin/parent 在 Import Inbox 人工确认。

## Vercel 部署

1. Push 到 GitHub。
2. Vercel import GitHub repo。
3. 设置 `.env.example` 中的环境变量，以及 `SUPABASE_SERVICE_ROLE_KEY`、`FAMILY_SYNC_ID`、`FAMILY_SESSION_SECRET` 和三个 `FAMILY_*_PASSWORD`。
4. Deploy。
5. 在 Supabase Auth 中加入生产域名 Redirect URL。

## 已实现的第一版能力

- PWA manifest 和 service worker。
- 三角色登录 demo、角色菜单、RoleGuard。
- 日程新增、查看、软删除、回收站恢复。
- Dashboard、Calendar、Child Schedule、Routes、Bus Timetable、Import Inbox、Conflicts、Backup、Account、Settings。
- 日语日期解析、令和转换、曜日校验、关键词分类、家长行动判断。
- Google Vision OCR 服务端接口和 mock fallback。
- 巴士时刻表 OCR 文本基础解析。
- CSV/JSON/manifest 备份导出。
- Supabase schema、seed、Storage bucket 说明。

## 后续建议

- 将当前 localStorage 数据层替换为 Supabase 查询和 RLS 精细策略。
- 接入真实文件上传到 `import-files` bucket。
- 为 event revisions 增加详情页展示。
- 使用 Supabase Edge Function 或服务端 route 完成完整 backup.zip 打包。
