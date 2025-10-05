# 音乐播放器使用说明

## 添加音乐文件

播放器支持两种方式：

### 方式1：使用远程URL（推荐）
1. 将音乐文件上传到CDN或图床
2. 编辑 `playlist.json` 文件，添加完整URL到 `files` 数组中

### 方式2：使用本地文件
1. 将MP3文件放到这个目录（source/music/）
2. 编辑 `playlist.json` 文件，添加文件名到 `files` 数组中

## playlist.json 格式示例

### 远程URL格式
```json
{
  "files": [
    "https://your-cdn.com/music/song1.mp3",
    "https://your-cdn.com/music/song2.mp3",
    "https://your-cdn.com/music/song3.mp3"
  ]
}
```

### 本地文件格式
```json
{
  "files": [
    "01-song-name.mp3",
    "02-another-song.mp3",
    "03-third-song.mp3"
  ]
}
```

### 混合使用
```json
{
  "files": [
    "https://your-cdn.com/music/song1.mp3",
    "local-song.mp3",
    "https://your-cdn.com/music/song3.mp3"
  ]
}
```

## 注意事项

- 音乐文件必须是MP3格式
- 远程URL会自动解码显示歌曲名
- 本地文件名建议使用数字前缀（如 01-、02-）来控制播放顺序
- 播放器只在首页（`/`）显示
- 进入页面后会自动开始播放（需要用户交互）
- 播放完一首会自动播放下一首（循环播放）
- 跨标签页播放控制：最早的标签页优先播放
