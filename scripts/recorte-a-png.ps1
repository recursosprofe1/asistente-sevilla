Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img -eq $null) {
  Write-Output 'NO_IMAGE'
  exit 0
}
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$dir = Join-Path (Get-Location) 'capturas'
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$out = Join-Path $dir ("recorte-" + $ts + ".png")
$img.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output $out
