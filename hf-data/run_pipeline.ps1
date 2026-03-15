[CmdletBinding()]
param(
    [string]$DataParquetPath,
    [switch]$SkipConvertScript2,
    [int]$NodeHeapMb = 8192
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$CommandName) {
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $CommandName"
    }
}

function Invoke-Step([string]$Command, [string[]]$Arguments, [string]$WorkingDirectory) {
    Write-Host "$Command $($Arguments -join ' ')" -ForegroundColor DarkGray
    Push-Location $WorkingDirectory
    try {
        & $Command @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataTransferDir = Join-Path $scriptDir 'dataTransfer'
$nodeMemoryArgs = @("--max-old-space-size=$NodeHeapMb")

Assert-Command 'python'
Assert-Command 'node'

if ($DataParquetPath) {
    $resolvedParquetPath = Resolve-Path $DataParquetPath
    Copy-Item -Path $resolvedParquetPath -Destination (Join-Path $dataTransferDir 'data.parquet') -Force
    Write-Host "Copied parquet to $(Join-Path $dataTransferDir 'data.parquet')" -ForegroundColor Green
}

$requiredFiles = @(
    (Join-Path $dataTransferDir 'data.parquet'),
    (Join-Path $dataTransferDir 'transfer.py'),
    (Join-Path $dataTransferDir 'convert.py'),
    (Join-Path $scriptDir 'filter_isolated_nodes.js'),
    (Join-Path $scriptDir 'convert_script.js')
)

foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path $requiredFile)) {
        throw "Required file not found: $requiredFile"
    }
}

Write-Step 'Python parquet -> source.json'
Invoke-Step 'python' @('transfer.py') $dataTransferDir

Write-Step 'Python source.json -> output_graph.json'
Invoke-Step 'python' @('convert.py') $dataTransferDir

$generatedGraphPath = Join-Path $dataTransferDir 'output_graph.json'
if (-not (Test-Path $generatedGraphPath)) {
    throw "Expected generated file not found: $generatedGraphPath"
}

Copy-Item -Path $generatedGraphPath -Destination (Join-Path $scriptDir 'output_graph.json') -Force

Write-Step "Filter isolated nodes (Node heap: ${NodeHeapMb} MB)"
Invoke-Step 'node' ($nodeMemoryArgs + @('filter_isolated_nodes.js')) $scriptDir

Write-Step "Generate layout and compliance artifacts (Node heap: ${NodeHeapMb} MB)"
Invoke-Step 'node' ($nodeMemoryArgs + @('convert_script.js')) $scriptDir

$convertScript2Path = Join-Path $scriptDir 'convert_script2.js'
if (-not $SkipConvertScript2 -and (Test-Path $convertScript2Path)) {
    Write-Step "Run secondary conversion stage (Node heap: ${NodeHeapMb} MB)"
    Invoke-Step 'node' ($nodeMemoryArgs + @('convert_script2.js')) $scriptDir
}

Write-Host ""
Write-Host 'Pipeline finished.' -ForegroundColor Green
Write-Host "Output: $(Join-Path $scriptDir 'galaxy_output_data')" -ForegroundColor Green
