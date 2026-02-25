Write-Host ">>> Dosearch V3 初始化环境 <<<" -ForegroundColor Cyan

# 检查 meilisearch.exe 是否存在
if (-not (Test-Path "meilisearch.exe")) {
    Write-Host "检测到缺失搜索引擎核心，正在从官方下载 (Windows-AMD64)..." -ForegroundColor Yellow
    $url = "https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-windows-amd64.exe"
    Invoke-WebRequest -Uri $url -OutFile "meilisearch.exe"
    Write-Host "下载完成！" -ForegroundColor Green
} else {
    Write-Host "搜索引擎核心已就绪。" -ForegroundColor Green
}

# 安装依赖
Write-Host "正在安装项目所有依赖..." -ForegroundColor Cyan
npm install

Write-Host ">>> 系统后端依赖环境与引擎初始验证完成，可输入以下命令进行开发预览： <<<" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Cyan
