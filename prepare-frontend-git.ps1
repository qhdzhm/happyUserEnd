# ===========================================
# 塔斯马尼亚旅游系统前端 - Git提交准备脚本
# ===========================================

Write-Host "==========================================" -ForegroundColor Green
Write-Host "🚀 塔斯马尼亚旅游系统前端 - Git提交准备" -ForegroundColor Green  
Write-Host "==========================================" -ForegroundColor Green

# 第1步：清理构建目录
Write-Host ""
Write-Host "📂 清理构建目录..." -ForegroundColor Blue
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
    Write-Host "✅ 已删除build目录" -ForegroundColor Green
} else {
    Write-Host "ℹ️  build目录不存在，跳过" -ForegroundColor Yellow
}

# 第2步：清理npm缓存文件
Write-Host ""
Write-Host "🧹 清理临时文件..." -ForegroundColor Blue
if (Test-Path ".eslintcache") {
    Remove-Item -Force ".eslintcache"
    Write-Host "✅ 已删除.eslintcache" -ForegroundColor Green
}

# 第3步：显示项目信息
Write-Host ""
Write-Host "📊 项目信息:" -ForegroundColor Blue
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "项目名称: $($packageJson.name)" -ForegroundColor Cyan
    Write-Host "版本: $($packageJson.version)" -ForegroundColor Cyan
    Write-Host "描述: $($packageJson.description)" -ForegroundColor Cyan
}

# 第4步：检查依赖项
Write-Host ""
Write-Host "📦 检查关键依赖..." -ForegroundColor Blue
$nodeModulesSize = if (Test-Path "node_modules") {
    [math]::Round((Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
} else { 0 }
Write-Host "node_modules大小: ${nodeModulesSize}MB" -ForegroundColor Cyan

# 第5步：显示当前更改统计
Write-Host ""
Write-Host "📈 代码统计:" -ForegroundColor Blue
$srcFiles = Get-ChildItem -Path "src" -Recurse -Include "*.js", "*.jsx", "*.css", "*.json" | Measure-Object
Write-Host "源码文件数量: $($srcFiles.Count)" -ForegroundColor Cyan

# 第6步：Git状态
Write-Host ""
Write-Host "📋 Git状态检查..." -ForegroundColor Blue
git status --porcelain | ForEach-Object {
    $status = $_.Substring(0,2)
    $file = $_.Substring(3)
    $color = switch ($status.Trim()) {
        "M" { "Yellow" }   # Modified
        "A" { "Green" }    # Added
        "D" { "Red" }      # Deleted
        "??" { "Cyan" }    # Untracked
        default { "White" }
    }
    Write-Host "$status $file" -ForegroundColor $color
}

Write-Host ""
Write-Host "✅ 前端项目准备完成，可以进行Git提交了！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green 