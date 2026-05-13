import type {Player} from "./gameState.ts";
import {CONFIG} from "../config.ts";
import type {Bullet, Enemy, EnemyBullet} from "../App.tsx";
import type {Upgrade} from "./upgrades.ts";
//nie bierze z gamestate tylko ma rzeczy przekazywane w App
const MINIMAP_SIZE = CONFIG.MINIMAP_SIZE;

export function drawMinimap({
        ctx,
        player,
        map,
        enemies,
        bullets,
        enemyBullets,
    }: {
        ctx: CanvasRenderingContext2D;
        player: Player;
        map: number[][];
        enemies: Enemy[];
        bullets: Bullet[];
        enemyBullets: EnemyBullet[];
    }) {
    const scaleX = MINIMAP_SIZE / map[0].length;
    const scaleY = MINIMAP_SIZE / map.length;
    const tileSize = Math.min(scaleX, scaleY);
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            ctx.fillStyle = map[y][x] === 1 ? "white" : "#111";
            ctx.fillRect(x * tileSize,y * tileSize, tileSize, tileSize);
        }
    }
    // Player
    ctx.fillStyle = "#22ff00";
    ctx.beginPath();
    ctx.arc(player.x * tileSize, player.y * tileSize, tileSize / 4, 0, Math.PI * 2);
    ctx.fill();
    // Player direction line
    ctx.strokeStyle = "#22ff00";
    ctx.beginPath();
    ctx.moveTo(player.x * tileSize, player.y * tileSize);
    ctx.lineTo(
        (player.x + Math.cos(player.angle)) * tileSize,
        (player.y + Math.sin(player.angle)) * tileSize
    );
    ctx.stroke();
    // Bullets
    ctx.fillStyle = "#31c5ff";
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x * tileSize, b.y * tileSize, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    // Enemies
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        ctx.fillStyle = "red";
        ctx.fillRect((enemy.x - 0.25) * tileSize, (enemy.y - 0.25) * tileSize, tileSize * 0.5, tileSize * 0.5);
    }
    // Enemy bullets
    ctx.fillStyle = "yellow";
    for (const e of enemyBullets) {
        ctx.beginPath();
        ctx.arc(e.x * tileSize, e.y * tileSize, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
export function drawPauseMenu({
      ctx,
      ui,
      screen,
    }: {
        ctx: CanvasRenderingContext2D;
        ui: { pauseMenuOpen: boolean };
        screen: { width: number; height: number };
    }){
    if (!ui.pauseMenuOpen) return;
    ui.pauseMenuOpen = true;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, screen.width, screen.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText("Game Paused", screen.width / 2, screen.height / 2);
}
export function drawUpgradeMenu({
        ctx,
        ui,
        screen,
    }: {
        ctx: CanvasRenderingContext2D;
        ui: {
            upgradeMenuOpen: boolean;
            currentUpgrades: Upgrade[];
            selectedUpgrade: number;
        };
        screen: { width: number; height: number };
    }) {
    if (!ui.upgradeMenuOpen) return;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, screen.width, screen.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText("Choose Upgrade", screen.width / 2, 120);
    ctx.font = "22px Arial";
    ctx.fillText("ENTER - Confirm", screen.width / 2, 170);
    const boxWidth = 300;
    const boxHeight = 180;
    const gap = 40;
    const totalWidth = boxWidth * 3 + gap * 2;
    const startX = screen.width / 2 - totalWidth / 2;
    for (let i = 0; i < ui.currentUpgrades.length; i++) {
        const upg = ui.currentUpgrades[i];
        const x = startX + i * (boxWidth + gap);
        const y = screen.height / 2 - boxHeight / 2;
        let color = "#555";
        if (upg.rarity === "rare") color = "#2a52ff";
        if (upg.rarity === "epic") color = "#a020f0";
        if (upg.rarity === "curse") color = "#c30000";
        ctx.fillStyle = color;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.lineWidth = i === ui.selectedUpgrade ? 6 : 2;
        ctx.strokeStyle =
            i === ui.selectedUpgrade
                ? "#ffff00"
                : "white";
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.fillText(upg.name, x + boxWidth / 2, y + 50);
        ctx.font = "20px Arial";
        ctx.fillText(upg.description, x + boxWidth / 2, y + 100);
        ctx.font = "18px Arial";
        ctx.fillText(upg.rarity.toUpperCase(), x + boxWidth / 2, y + 145);
    }
}
export function drawUI({
    ctx,
    state,
    screen,
}:{
    ctx: CanvasRenderingContext2D;
    state: {money: number, lives:boolean[], moneyMultiplier:number, playerShootDelay: number, bulletCount: number, enemyModifier:number, wave: number, playerSpeedMultiplier:number,playerBulletSpeedMultiplier:number};
    screen: { width: number; height: number };
}){
    //hud
    ctx.textAlign = "right";
    const hudX = screen.width - 20;
    let hudY = 30;
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText(`Money: ${state.money}`, hudX, hudY);
    // HEARTS
    const aliveLives = state.lives.filter(l => l).length;
    const maxWidth = screen.width-MINIMAP_SIZE;
    const spacing = 4;
    let heartSize = 20;
    const requiredWidth = aliveLives * (heartSize + spacing);
    if (requiredWidth > maxWidth) {
        heartSize = (maxWidth / aliveLives) - spacing;
    }
    heartSize = Math.max(6, heartSize);
    const startX = screen.width - 20;
    const startY = hudY+10;
    for (let i = 0; i < state.lives.length; i++) {
        ctx.fillStyle = state.lives[i] ? "red" : "#555";
        const x = startX - (i + 1) * (heartSize + spacing);
        ctx.fillRect(x, startY, heartSize, heartSize);
    }
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    hudY+=30;
    ctx.fillText(`Wave: ${state.wave}`, hudX, hudY + 30);
    ctx.fillText(`Money Multiplier: x${state.moneyMultiplier}`, hudX, hudY + 60);
    ctx.fillText(`Cooldown: ${state.playerShootDelay}`, hudX, hudY + 90);
    ctx.fillText(`Bullets: ${state.bulletCount}`, hudX, hudY + 120);
    ctx.fillText(`Enemies Per Round: ${state.wave+state.enemyModifier}`, hudX, hudY + 150);
    ctx.fillText(`Movement Speed: ${state.playerSpeedMultiplier}`, hudX, hudY + 180);//nie faktyczna szybkosc ale lepiej wyglada to dla gracza
    ctx.fillText(`Bullet Speed: ${state.playerBulletSpeedMultiplier}`, hudX, hudY + 210);
    const size = 10; //celownik
    const centerX = screen.width / 2;
    const centerY = screen.height / 2;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();//linia -
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.stroke();
    ctx.beginPath();//linia |
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();
}