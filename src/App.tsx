import { useEffect, useRef } from "react";
import "./App.css";
import { CONFIG } from "./config";
import {getRandomCurse, type Upgrade} from "./game/upgrades.ts";
import {getRandomUpgrades} from "./game/upgrades.ts";
import {gameState} from "./game/gameState.ts";
import {createMap} from "./game/map.ts";
import {render3D} from "./game/render.tsx";
import {drawMinimap, drawPauseMenu, drawUpgradeMenu, drawUI, drawShopMenu} from "./game/ui.ts";
import type {Player} from "./game/gameState.ts";
import {createShop, refreshShopPrices, rerollShop} from "./game/shop";
import {spawnEnemy, updateEnemies, type Enemy, type EnemyBullet} from "./game/enemies.ts";

//highscore: 26

export type Bullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};
const bullets: Bullet[] = [];

const enemies: Enemy[] = [];

const enemyBullets: EnemyBullet[] = [];

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  lifetime: number;
};
let pauseMenuOpen = false;
let pauseSettingsOpen = false;
let upgradeMenuOpen = false;
let shopMenuOpen = false;
let currentUpgrades: Upgrade[] = [];
let selectedUpgrade = 0;
let selectedShopItem = 0;
let selectedSetting = 0;
let mouseSensitivity = 0.09;
let maxParticles = 250;

const particles: Particle[] = [];
let playerShootCooldown = 0;

//wymiary ekranu
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
//predkosc gracza i kamery i pocisków
const BASE_MOVE_SPEED = CONFIG.BASE_MOVE_SPEED;
const ROT_SPEED = CONFIG.ROT_SPEED;
const MOUSE_FINE_AIM_EXPONENT = CONFIG.MOUSE_FINE_AIM_EXPONENT;
const MOUSE_FINE_AIM_REFERENCE = CONFIG.MOUSE_FINE_AIM_REFERENCE;
const BASE_BULLET_SPEED = CONFIG.BASE_BULLET_SPEED;

const spread = CONFIG.BASE_BULLET_SPREAD;

const keys: Record<string, boolean> = {};
const MAP = createMap();
const SHOP = createShop(MAP, gameState.ui.shopPurchaseCount, gameState.stats.moneyMultiplier);
const SETTINGS_COUNT = 2;

function getSpawn() {
  while (true) {
    const x = Math.floor(Math.random() * (MAP[0].length-2)) + 1;
    const y = Math.floor(Math.random() * (MAP.length-2)) + 1;
    if (MAP[y][x] === 0) {
      return {
        x: x + 0.5,
        y: y + 0.5,
      };
    }
  }
}
const spawn = getSpawn();

const PLAYER: Player = {
  x: spawn.x,
  y: spawn.y,
  angle: Math.random() * Math.PI * 2,
};
for (let i = 0; i < CONFIG.STARTING_ENEMIES; i++) {
  enemies.push(spawnEnemy({map: MAP, player: PLAYER}));
}

function isWall(x: number, y: number) {
  const mapX = Math.floor(x);
  const mapY = Math.floor(y);
  if (
      mapX < 0 ||
      mapY < 0 ||
      mapY >= MAP.length ||
      mapX >= MAP[0].length
  ) {
    return true;
  }
  return MAP[mapY][mapX] === 1;
}
function loseLife() {
  for (let i = 0; i < gameState.stats.lives.length; i++){
    if (gameState.stats.lives[i]) {
      gameState.stats.lives[i] = false;
      return;
    }
  }
  alert(`Game Over! Wave: ${gameState.world.wave}`);
  window.location.reload();
}
function spawnWallHitParticle(x: number, y: number, color: string, radius: number, lifetime: number) {
  addParticle({
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    radius,
    lifetime,
  });
}
function addParticle(particle: Particle) {
  if (maxParticles <= 0) return;
  while (particles.length >= maxParticles) {
    particles.shift();
  }
  particles.push(particle);
}
function spawnParticles(x: number, y: number, color: string, count: number, radius: number, speed: number, lifetime: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speedFactor = Math.random() * speed;
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speedFactor,
      vy: Math.sin(angle) * speedFactor,
      color,
      radius: radius * (0.5 + Math.random() * 0.5),
      lifetime: lifetime + Math.floor(Math.random() * lifetime),
    });
  }
}
function castRay(x: number, y: number, angle: number) {
  let distance = 0;

  while (distance < 20) {
    const rayX = x + Math.cos(angle) * distance;
    const rayY = y + Math.sin(angle) * distance;

    if (isWall(rayX, rayY)) {
      return distance;
    }
    distance += 0.01;
  }
  return 20;
}
function getMouseLookDelta(movementX: number) {
  const direction = Math.sign(movementX);
  const amount = Math.abs(movementX);
  const curvedAmount =
      Math.pow(amount / MOUSE_FINE_AIM_REFERENCE, MOUSE_FINE_AIM_EXPONENT) *
      MOUSE_FINE_AIM_REFERENCE;

  return direction * curvedAmount * mouseSensitivity;
}
function changeMouseSensitivity(direction: number) {
  mouseSensitivity = Math.min(
      0.15,
      Math.max(0.005, mouseSensitivity + direction * 0.005)
  );
  mouseSensitivity = Number(mouseSensitivity.toFixed(3));
}
function changeMaxParticles(direction: number) {
  maxParticles = Math.min(
      600,
      Math.max(0, maxParticles + direction * 25)
  );
  while (particles.length > maxParticles) {
    particles.shift();
  }
}
function getBulletCollisionSteps(distance: number) {
  return Math.max(2, Math.ceil(distance / 0.04));
}
function movePlayer(moveX: number, moveY: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(moveX, moveY) / 0.04));
  const stepX = moveX / steps;
  const stepY = moveY / steps;

  for (let i = 0; i < steps; i++) {
    const nextX = PLAYER.x + stepX;
    const nextY = PLAYER.y + stepY;

    if (!isWall(nextX, PLAYER.y)) {
      PLAYER.x = nextX;
    }
    if (!isWall(PLAYER.x, nextY)) {
      PLAYER.y = nextY;
    }
  }
}
function getSegmentCircleHitT(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    circleX: number,
    circleY: number,
    radius: number
) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    return Math.hypot(startX - circleX, startY - circleY) <= radius ? 0 : null;
  }

  const rawT =
      ((circleX - startX) * segmentX + (circleY - startY) * segmentY) /
      segmentLengthSquared;
  const t = Math.min(1, Math.max(0, rawT));
  const closestX = startX + segmentX * t;
  const closestY = startY + segmentY * t;

  return Math.hypot(closestX - circleX, closestY - circleY) <= radius ? t : null;
}
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.onclick = () => {
      canvas.requestPointerLock();
    };
    const mouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        PLAYER.angle += getMouseLookDelta(e.movementX);
      }
    };

    window.addEventListener("mousemove", mouseMove);
    const keyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys[key] = true;
      if (pauseMenuOpen) {
        if (pauseSettingsOpen) {
          if (key === "arrowup" || key === "w") {
            selectedSetting--;
            if (selectedSetting < 0) selectedSetting = SETTINGS_COUNT - 1;
          }
          if (key === "arrowdown" || key === "s") {
            selectedSetting++;
            if (selectedSetting >= SETTINGS_COUNT) selectedSetting = 0;
          }
          if (key === "arrowleft" || key === "a") {
            if (selectedSetting === 0) changeMouseSensitivity(-1);
            if (selectedSetting === 1) changeMaxParticles(-1);
          }
          if (key === "arrowright" || key === "d") {
            if (selectedSetting === 0) changeMouseSensitivity(1);
            if (selectedSetting === 1) changeMaxParticles(1);
          }
          if (key === "enter") {
            pauseSettingsOpen = false;
          }
          if (key === "escape") {
            pauseSettingsOpen = false;
          }
          return;
        }

        if (key === "enter") {
          pauseSettingsOpen = true;
          return;
        }
      }
      if (key === "e") {
        const dx = PLAYER.x - SHOP.x;
        const dy = PLAYER.y - SHOP.y;
        if (Math.hypot(dx, dy) < 1.5) {
          shopMenuOpen = !shopMenuOpen;
        }
      }
      if (shopMenuOpen) {
        if (key === "arrowleft" || key === "a") {
          selectedShopItem--;
          if (selectedShopItem < 0) {
            selectedShopItem = SHOP.upgrades.length - 1;
          }
        }
        if (key === "arrowright" || key === "d") {
          selectedShopItem++;
          if (selectedShopItem >= SHOP.upgrades.length) {
            selectedShopItem = 0;
          }
        }
        if (key === "enter") {
          const item = SHOP.upgrades[selectedShopItem];
          if (gameState.stats.money >= item.price) {
            gameState.stats.money -= item.price;
            item.apply(gameState);
            gameState.ui.shopPurchaseCount++;
            refreshShopPrices(SHOP, gameState.ui.shopPurchaseCount, gameState.stats.moneyMultiplier)
            SHOP.upgrades.splice(selectedShopItem, 1);
            if (selectedShopItem >= SHOP.upgrades.length) {
              selectedShopItem = 0;
            }
          }
        }
        if (key === "r") {
          if (gameState.stats.money >= 50) {
            gameState.stats.money -= 50;
            rerollShop(SHOP, gameState.ui.shopPurchaseCount, gameState.stats.moneyMultiplier);
          }
        }
      }
      if (upgradeMenuOpen){
        if (key === "arrowleft" || key === "a") {
          selectedUpgrade--;
          if (selectedUpgrade < 0) {
            selectedUpgrade = currentUpgrades.length - 1;
          }
        }
        if (key === "arrowright" || key === "d") {
          selectedUpgrade++;
          if (selectedUpgrade >= currentUpgrades.length) {
            selectedUpgrade = 0;
          }
        }
        if (key === "enter") {
          const upgrade = currentUpgrades[selectedUpgrade];
          if (!upgrade) return;
          upgrade.apply(gameState);
          upgradeMenuOpen = false;
          const enemyCount = Math.max(1, gameState.world.wave + gameState.stats.enemyModifier);
          for (let i = 0; i < enemyCount; i++) {//spawn przeciwników po rundzie
            enemies.push(spawnEnemy({map: MAP, player: PLAYER, minDistance: 7}));
          }
        }
      }
      if (key === "escape") {
        pauseMenuOpen = !pauseMenuOpen;
        pauseSettingsOpen = false;
        return;
      }

    };
    const keyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    let mouseDown = false;

    window.addEventListener("mousedown", () => (mouseDown = true));
    window.addEventListener("mouseup", () => (mouseDown = false));
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);


    function update() {
      if (pauseMenuOpen) return;
      if (upgradeMenuOpen) return;
      if (shopMenuOpen) return;

      if (keys["arrowleft"]) {//movement
        PLAYER.angle -= ROT_SPEED;
      }
      if (keys["arrowright"]) {
        PLAYER.angle += ROT_SPEED;
      }

      let moveX = 0;
      let moveY = 0;

      if (keys["w"]) {
        moveX += Math.cos(PLAYER.angle);
        moveY += Math.sin(PLAYER.angle);
      }
      if (keys["s"]) {
        moveX -= Math.cos(PLAYER.angle);
        moveY -= Math.sin(PLAYER.angle);
      }
      if (keys["a"]) {
        moveX += Math.cos(PLAYER.angle - Math.PI / 2);
        moveY += Math.sin(PLAYER.angle - Math.PI / 2);
      }
      if (keys["d"]) {
        moveX += Math.cos(PLAYER.angle + Math.PI / 2);
        moveY += Math.sin(PLAYER.angle + Math.PI / 2);
      }
      if (CONFIG.DEBUG && keys["."]) {
        gameState.stats.lives.push(true);
      }
      if (CONFIG.DEBUG && keys[","]) {
        gameState.stats.lives.pop();
      }
      if (CONFIG.DEBUG && keys[";"]) {
        enemies.push(spawnEnemy({map: MAP, player: PLAYER}));
      }
      if (CONFIG.DEBUG && keys["i"]) {
        gameState.stats.playerShootDelayMultiplier*=1.1;
      }
      if (CONFIG.DEBUG && keys["o"]) {
        gameState.stats.playerBulletSpeedMultiplier*=1.1;
      }
      if (CONFIG.DEBUG && keys["p"]) {
        gameState.stats.bulletCount++;
      }
      if (CONFIG.DEBUG && keys["j"]) {
        gameState.stats.playerShootDelayMultiplier*=0.9;
      }
      if (CONFIG.DEBUG && keys["k"]) {
        gameState.stats.playerBulletSpeedMultiplier*=0.9;
      }
      if (CONFIG.DEBUG && keys["l"]) {
        gameState.stats.bulletCount--;
      }
      if (CONFIG.DEBUG && keys["n"]) {
        gameState.stats.playerSpeedMultiplier*=1.1;
      }
      if (CONFIG.DEBUG && keys["m"]) {
        gameState.stats.playerSpeedMultiplier*=0.9;
      }
      if (CONFIG.DEBUG && keys["u"]) {
        gameState.stats.playerBulletSpreadMultiplier*=0.9;
      }
      if (CONFIG.DEBUG && keys["h"]) {
        gameState.stats.playerBulletSpreadMultiplier*=1.1;
      }
      const length = Math.hypot(moveX, moveY);
      if (length > 0) {
        moveX = (moveX / length) * BASE_MOVE_SPEED * gameState.stats.playerSpeedMultiplier;
        moveY = (moveY / length) * BASE_MOVE_SPEED * gameState.stats.playerSpeedMultiplier;
      }

      if (playerShootCooldown > 0) playerShootCooldown--;
      if ((keys[" "] || mouseDown) && playerShootCooldown <= 0){
        for (let i = 0; i < gameState.stats.bulletCount; i++) {
          let angleOffset = 0;
          if (gameState.stats.bulletCount > 1) {
            angleOffset = ((i - (gameState.stats.bulletCount - 1) / 2 )* spread * gameState.stats.playerBulletSpreadMultiplier )
          }
          bullets.push({
            x: PLAYER.x,
            y: PLAYER.y,
            angle: PLAYER.angle + angleOffset,
            speed: BASE_BULLET_SPEED*gameState.stats.playerBulletSpeedMultiplier,
            distance: 0,
          });
        }
        playerShootCooldown = CONFIG.PLAYER_SHOOT_DELAY * gameState.stats.playerShootDelayMultiplier;
      }
      movePlayer(moveX, moveY);
      updateEnemies({enemies, enemyBullets, player: PLAYER, isWall, castRay});
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const prevX = b.x;
        const prevY = b.y;
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;

        const steps = getBulletCollisionSteps(b.speed);
        let wallHitT: number | null = null;
        let wallHitX = b.x;
        let wallHitY = b.y;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const checkX = prevX + (b.x - prevX) * t;
          const checkY = prevY + (b.y - prevY) * t;
          if (isWall(checkX, checkY)) {
            wallHitT = t;
            wallHitX = checkX;
            wallHitY = checkY;
            break;
          }
        }

        let hitEnemy: Enemy | null = null;
        let enemyHitT = Number.POSITIVE_INFINITY;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const hitT = getSegmentCircleHitT(prevX, prevY, b.x, b.y, enemy.x, enemy.y, enemy.size);
          if (hitT !== null && hitT < enemyHitT) {
            hitEnemy = enemy;
            enemyHitT = hitT;
          }
        }

        if (hitEnemy && (wallHitT === null || enemyHitT <= wallHitT)) {
          hitEnemy.alive = false;
          gameState.stats.money += CONFIG.MONEY_PER_KILL * gameState.stats.moneyMultiplier;
          spawnParticles(hitEnemy.x, hitEnemy.y, "red", 15, 0.05, 0.1, 30);
          bullets.splice(i, 1);
          continue;
        }

        if (wallHitT !== null) {
          spawnWallHitParticle(wallHitX, wallHitY, "#31c5ff", 0.03, 30);
          bullets.splice(i, 1);
        }
      }
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        const prevX = b.x;
        const prevY = b.y;
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;

        const steps = getBulletCollisionSteps(b.speed);
        let wallHitT: number | null = null;
        let wallHitX = b.x;
        let wallHitY = b.y;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const checkX = prevX + (b.x - prevX) * t;
          const checkY = prevY + (b.y - prevY) * t;
          if (isWall(checkX, checkY)) {
            wallHitT = t;
            wallHitX = checkX;
            wallHitY = checkY;
            break;
          }
        }
        const playerHitT = getSegmentCircleHitT(prevX, prevY, b.x, b.y, PLAYER.x, PLAYER.y, 0.3);
        if (playerHitT !== null && (wallHitT === null || playerHitT <= wallHitT)) {
          enemyBullets.splice(i, 1);
          gameState.effects.damageFlash = 10;
          loseLife();
          continue;
        }

        if (wallHitT !== null) {
          spawnWallHitParticle(wallHitX, wallHitY, "yellow", 0.03, 20);
          enemyBullets.splice(i, 1);
        }
      }
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length === 0) {//koniec rundy
        enemies.length = 0;
        gameState.world.wave+=1;
        for(let b = enemyBullets.length - 1; b >= 0; b--) {
          enemyBullets.splice(b,1)
        }
        if(gameState.world.wave%5==0){
          upgradeMenuOpen = true;//choose a curse
          currentUpgrades = getRandomCurse(3);
          selectedUpgrade = 0;
        }else{
          upgradeMenuOpen = true;//choose an upgrade
          currentUpgrades = getRandomUpgrades(3);
          selectedUpgrade = 0;
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
        if (p.lifetime <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    function gameLoop() {
      update();
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      render3D({ctx, player: PLAYER, enemies, bullets, enemyBullets, particles, castRay, shop:SHOP, screen:{width:SCREEN_WIDTH,height:SCREEN_HEIGHT}});
      drawMinimap({ctx, player: PLAYER, map: MAP, enemies, bullets, enemyBullets, shop:SHOP});
      drawUI({ctx, state: {money: gameState.stats.money, lives:gameState.stats.lives, moneyMultiplier:gameState.stats.moneyMultiplier, playerShootDelayMultiplier: gameState.stats.playerShootDelayMultiplier, bulletCount: gameState.stats.bulletCount, enemyModifier:gameState.stats.enemyModifier, wave: gameState.world.wave, aliveEnemies: enemies.filter(e => e.alive).length, playerSpeedMultiplier: gameState.stats.playerSpeedMultiplier, playerBulletSpeedMultiplier: gameState.stats.playerBulletSpeedMultiplier, playerBulletSpreadMultiplier: gameState.stats.playerBulletSpreadMultiplier}, screen: {width: SCREEN_WIDTH, height: SCREEN_HEIGHT}})
      drawShopMenu({ctx, ui: {shopMenuOpen, upgrades: SHOP.upgrades, selected: selectedShopItem, money: gameState.stats.money,}, screen: {width: SCREEN_WIDTH, height: SCREEN_HEIGHT,}});
      drawUpgradeMenu({ctx, ui: {upgradeMenuOpen: upgradeMenuOpen, currentUpgrades: currentUpgrades, selectedUpgrade: selectedUpgrade}, screen: {width: SCREEN_WIDTH, height: SCREEN_HEIGHT}});
      drawPauseMenu({
        ctx,
        ui: {
          pauseMenuOpen,
          settingsOpen: pauseSettingsOpen,
          selectedSetting,
          mouseSensitivity,
          maxParticles,
        },
        screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
      });
      requestAnimationFrame(gameLoop);
    }
    gameLoop();

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return (
      <div className="back">
        <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}/>
      </div>
  );
}
