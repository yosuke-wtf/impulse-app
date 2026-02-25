<p align="center">
  <img src="public/logo.png" width="90" alt="Impulse Logo" />
</p>

<h1 align="center">Impulse</h1>

<p align="center">
  <b>The ultimate League of Legends companion app for serious players.</b><br/>
  Real-time stats • Rank tracking • Smart overlays • Live game analysis
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=flat-square&logo=windows" />
  <img src="https://img.shields.io/badge/Built%20with-Electron-47848F?style=flat-square&logo=electron" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/github/v/release/yosuke-wtf/impulse-app?style=flat-square&label=Latest%20Release&color=00f2ff" />
</p>

---

## ✨ Features

- 🎮 **Player Dashboard** — Real-time rank, winrate, and recent match history
- 📊 **Live Game Overlay** — See all enemy ranks and winrates before the game starts
- 🏆 **Tier Lists** — Mode-specific champion rankings (Solo, ARAM, URF, Arena)
- ⚡ **Auto-Runes** — [Planned] Smart rune recommendations per champion
- 📢 **Global Announcements** — Admin-pushed news and updates directly in the app
- 🔄 **Auto-Update** — Always stay on the latest version automatically

---

## 📦 Download

Head over to [Releases](https://github.com/yosuke-wtf/impulse-app/releases) to download the latest version.

> Run `Impulse Setup x.x.x.exe` and follow the installer.

---

## 🛠️ Development Setup

```bash
# Clone the repository
git clone https://github.com/yosuke-wtf/impulse-app.git
cd impulse-app

# Install dependencies
npm install

# Create your environment file
cp src/.env.example src/.env
# Fill in your RIOT_API_KEY, REGION and SUMMONER_NAME

# Start in development mode
npm run dev
```

---

## ⚙️ Environment Variables

Create a file at `src/.env`:

```env
RIOT_API_KEY=YOUR_API_KEY_HERE
REGION=euw1
SUMMONER_NAME=YourSummonerName
AdminAllowed=YOUR_DISCORD_ID
```

> Get your Riot API Key at [developer.riotgames.com](https://developer.riotgames.com)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | [Electron](https://electronjs.org) |
| Frontend | HTML, CSS, TypeScript |
| Build Tool | [Vite](https://vitejs.dev) |
| Riot API | [Riot Games API](https://developer.riotgames.com) |
| Auto-Updates | [electron-updater](https://www.electron.build/auto-update) |

---

## 📸 Screenshots

> Coming soon

---

<p align="center">Made with ❤️ by <a href="https://github.com/yosuke-wtf">yosuke-wtf</a></p>
