param(
    [Parameter(Mandatory = $true)]
    [string]$RepoUrl
)

Write-Host "Publishing StarnX Society Application to GitHub..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not available in this PowerShell window."
    Write-Host "Open a new PowerShell window after installing Git, or use GitHub Desktop."
    exit 1
}

git init
git add .
git commit -m "Initial StarnX Society web app"
git branch -M main

$existingRemote = git remote
if ($existingRemote -contains "origin") {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

git push -u origin main

Write-Host "Done. Now import this GitHub repository in Vercel."
