import type {Player} from "./gameState.ts";
import {CONFIG} from "../config.ts";
import type {Bullet} from "../App.tsx";
import type {Enemy, EnemyBullet} from "./enemies.ts";
import type {Upgrade} from "./upgrades.ts";
//nie bierze z gamestate tylko ma rzeczy przekazywane w App
const MINIMAP_SIZE = CONFIG.MINIMAP_SIZE;

function drawOutlinedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fillStyle = "white"
) {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
}

export function drawMinimap({
        ctx,
        player,
        map,
        enemies,
        bullets,
        enemyBullets,
        shop
    }: {
        ctx: CanvasRenderingContext2D;
        player: Player;
        map: number[][];
        enemies: Enemy[];
        bullets: Bullet[];
        enemyBullets: EnemyBullet[];
        shop: {x:number, y:number};
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
    //Shop
    ctx.fillStyle = "yellow";
    ctx.fillRect(
        (shop.x - 0.3) * tileSize,
        (shop.y - 0.3) * tileSize,
        tileSize * 0.6,
        tileSize * 0.6
    );
}
export function drawPauseMenu({
      ctx,
      ui,
      screen,
    }: {
        ctx: CanvasRenderingContext2D;
        ui: {
            pauseMenuOpen: boolean;
            settingsOpen: boolean;
            selectedSetting: number;
            mouseSensitivity: number;
            maxParticles: number;
        };
        screen: { width: number; height: number };
    }){
    if (!ui.pauseMenuOpen) return;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, screen.width, screen.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText(ui.settingsOpen ? "Settings" : "Game Paused", screen.width / 2, screen.height / 2 - 90);
    ctx.font = "24px Arial";

    if (ui.settingsOpen) {
        const mousePrefix = ui.selectedSetting === 0 ? "> " : "  ";
        const particlePrefix = ui.selectedSetting === 1 ? "> " : "  ";
        ctx.textAlign = "left";
        const settingsX = screen.width / 2 - 190;
        ctx.fillText(`${mousePrefix}Mouse Sensitivity`, settingsX, screen.height / 2 - 35);
        ctx.fillText(`${particlePrefix}Max Particles`, settingsX, screen.height / 2 + 25);
        ctx.textAlign = "right";
        ctx.fillText(`< ${ui.mouseSensitivity.toFixed(3)} >`, screen.width / 2 + 190, screen.height / 2 - 35);
        ctx.fillText(`< ${ui.maxParticles} >`, screen.width / 2 + 190, screen.height / 2 + 25);
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText("Up / Down - Select | Left / Right - Adjust", screen.width / 2, screen.height / 2 + 95);
        ctx.fillText("ENTER / ESC - Back", screen.width / 2, screen.height / 2 + 130);
        return;
    }

    ctx.fillText("ENTER - Settings", screen.width / 2, screen.height / 2 - 20);
    ctx.fillText("ESC - Resume", screen.width / 2, screen.height / 2 + 20);
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
        let color = "#555";//common
        if (upg.rarity === "rare") color = "#2a52ff";
        if (upg.rarity === "epic") color = "#a020f0";
        if (upg.rarity === "legendary") color = "#ffdd03";
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
    state: {money: number, lives:boolean[], moneyMultiplier:number, playerShootDelayMultiplier: number, bulletCount: number, enemyModifier:number, wave: number, aliveEnemies: number, playerSpeedMultiplier:number,playerBulletSpeedMultiplier:number,playerBulletSpreadMultiplier:number};
    screen: { width: number; height: number };
}){
    //hud
    ctx.textAlign = "right";
    const hudX = screen.width - 20;
    let hudY = 30;
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    drawOutlinedText(ctx, `Money: ${state.money}`, hudX, hudY);
    // HEARTS
    const aliveLives = state.lives.filter(l => l).length;
    const maxWidth = screen.width-MINIMAP_SIZE-24;
    const spacing = 4;
    let heartWidth = 20;
    const requiredWidth = aliveLives * (heartWidth + spacing);
    if (requiredWidth > maxWidth) {
        heartWidth = (maxWidth / aliveLives) - spacing;
    }
    const startX = screen.width - 20;
    const startY = hudY+10;
    for (let i = 0; i < state.lives.length; i++) {
        ctx.fillStyle = state.lives[i] ? "red" : "#555";
        const x = startX - (i + 1) * (heartWidth + spacing);
        ctx.fillRect(x, startY, heartWidth, hudY-10);
    }

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    hudY+=30;
    drawOutlinedText(ctx, `Wave: ${state.wave}`, hudX, hudY + 30);
    drawOutlinedText(ctx, `Alive Enemies: ${state.aliveEnemies}`, hudX, hudY + 60);
    drawOutlinedText(ctx, `Enemies Per Round: ${state.wave+state.enemyModifier <= 0 ? 1 : state.wave+state.enemyModifier}`, hudX, hudY + 90);
    drawOutlinedText(ctx, `Money Multiplier: x${state.moneyMultiplier}`, hudX, hudY + 120);
    drawOutlinedText(ctx, `Fire Rate: ${state.playerShootDelayMultiplier.toFixed(3)}`, hudX, hudY + 150);
    drawOutlinedText(ctx, `Bullets: ${state.bulletCount}`, hudX, hudY + 180);
    drawOutlinedText(ctx, `Movement Speed: ${state.playerSpeedMultiplier.toFixed(3)}`, hudX, hudY + 210);//nie faktyczna szybkosc ale lepiej wyglada to dla gracza
    drawOutlinedText(ctx, `Bullet Speed: ${state.playerBulletSpeedMultiplier.toFixed(3)}`, hudX, hudY + 240);
    drawOutlinedText(ctx, `Bullet Spread: ${state.playerBulletSpreadMultiplier.toFixed(3)}`, hudX, hudY + 270);
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
export function drawShopMenu({ctx, ui, screen,}: {
    ctx: CanvasRenderingContext2D;
    ui: {
        shopMenuOpen: boolean;
        upgrades: {
            name: string;
            description: string;
            rarity: string;
            price: number;
        }[];
        selected: number;
        money: number;
    };
    screen: { width: number; height: number };
}) {
    if (!ui.shopMenuOpen) return;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, screen.width, screen.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "yellow";
    ctx.font = "48px Arial";
    ctx.fillText("SHOP", screen.width / 2, 100);
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(`Money: ${ui.money}`, screen.width / 2, 150);
    ctx.fillText("ENTER - Buy | R - Reroll (50) | E - Exit", screen.width / 2, 190);
    const boxWidth = 280;
    const boxHeight = 220;
    const gap = 40;
    const totalWidth = ui.upgrades.length * boxWidth + (ui.upgrades.length - 1) * gap;
    const startX = screen.width / 2 - totalWidth / 2;
    for (let i = 0; i < ui.upgrades.length; i++) {
        const item = ui.upgrades[i];
        const x = startX + i * (boxWidth + gap);
        const y = screen.height / 2 - boxHeight / 2;
        let color = "#555";
        if (item.rarity === "rare") color = "#2a52ff";
        if (item.rarity === "epic") color = "#a020f0";
        if (item.rarity === "legendary") color = "#ffdd03";
        ctx.fillStyle = color;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.lineWidth = i === ui.selected ? 6 : 2;
        ctx.strokeStyle = i === ui.selected ? "#00ff00" : "white";
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        ctx.fillStyle = "white";
        ctx.font = "26px Arial";
        ctx.fillText(item.name, x + boxWidth / 2, y + 50);
        ctx.font = "18px Arial";
        ctx.fillText(item.description, x + boxWidth / 2, y + 95);
        ctx.font = "20px Arial";
        ctx.fillText(`$${item.price}`, x + boxWidth / 2, y + 150);
        ctx.font = "18px Arial";
        ctx.fillText(item.rarity.toUpperCase(), x + boxWidth / 2, y + 185);
    }
}
