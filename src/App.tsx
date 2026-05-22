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

//highscore: 26

export type Bullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};
const bullets: Bullet[] = [];

export type Enemy = {
  x: number;
  y: number;
  cooldown: number;
  size: number;
  alive: boolean;
  moveDir: number;
  moveTimer: number;
  reactionTimer: number;
};
const enemies: Enemy[] = [];

export type EnemyBullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};
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
let mouseSensitivity = 0.09;

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
const SHOP = createShop(MAP, gameState.ui.shopPurchaseCount);

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
function spawnEnemy(minDistance = CONFIG.ENEMY_MIN_DISTANCE): Enemy {//przeciwnicy
  while (true) {
    const x = Math.floor(Math.random() * (MAP[0].length - 2)) + 1 + 0.5;
    const y = Math.floor(Math.random() * (MAP.length - 2)) + 1 + 0.5;

    if (MAP[Math.floor(y)][Math.floor(x)] !== 0) continue;

    const dx = x - PLAYER.x;
    const dy = y - PLAYER.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= minDistance) {
      return {
        x,
        y,
        cooldown: Math.random() * 100 + 50,
        size: CONFIG.ENEMY_SIZE,
        alive: true,
        moveDir: 0,
        moveTimer: 10,
        reactionTimer: CONFIG.ENEMY_REACTION_TIME,
      };
    }
  }
}
for (let i = 0; i < CONFIG.STARTING_ENEMIES; i++) {
  enemies.push(spawnEnemy());
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
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    radius,
    lifetime,
  });
}
function spawnParticles(x: number, y: number, color: string, count: number, radius: number, speed: number, lifetime: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speedFactor = Math.random() * speed;
    particles.push({
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
function canSeePlayer(enemy: Enemy) {
  const dx = PLAYER.x - enemy.x;
  const dy = PLAYER.y - enemy.y;
  const angle = Math.atan2(dy, dx);
  const distanceToPlayer = Math.hypot(dx, dy);
  const distanceToWall = castRay(enemy.x, enemy.y, angle);
  return distanceToPlayer <= distanceToWall;
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
          if (key === "arrowleft" || key === "a") {
            changeMouseSensitivity(-1);
          }
          if (key === "arrowright" || key === "d") {
            changeMouseSensitivity(1);
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
            refreshShopPrices(SHOP, gameState.ui.shopPurchaseCount)
            SHOP.upgrades.splice(selectedShopItem, 1);
            if (selectedShopItem >= SHOP.upgrades.length) {
              selectedShopItem = 0;
            }
          }
        }
        if (key === "r") {
          if (gameState.stats.money >= 50) {
            gameState.stats.money -= 50;
            rerollShop(SHOP, gameState.ui.shopPurchaseCount);
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
            enemies.push(spawnEnemy(7));
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
        enemies.push(spawnEnemy());
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
      const nextX = PLAYER.x + moveX;
      const nextY = PLAYER.y + moveY;
      if (!isWall(nextX, PLAYER.y)) {
        PLAYER.x = nextX;
      }
      if (!isWall(PLAYER.x, nextY)) {
        PLAYER.y = nextY;
      }
      // ruch i strzały przeciwników
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        //strzał w gracza
        if (canSeePlayer(enemy)) {
          if (enemy.reactionTimer > 0) {
            enemy.reactionTimer--;
          } else {
            enemy.cooldown--;
          }
        } else {
          enemy.reactionTimer = CONFIG.ENEMY_REACTION_TIME;
        }

        if (enemy.cooldown <= 0 && enemy.reactionTimer <= 0) {
          const angle = Math.atan2(PLAYER.y - enemy.y, PLAYER.x - enemy.x);
          enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            angle,
            speed: BASE_BULLET_SPEED * 0.4,
            distance: 0,
          });
          enemy.cooldown = Math.random() * 100 + 50;
        }
        //ruch
        if (!enemy.moveDir || enemy.moveTimer <= 0) {
          enemy.moveDir = Math.random() * Math.PI * 2;
          enemy.moveTimer = Math.floor(Math.random() * 60 + 30); // move 0.5-1s at 60fps
        }
        const moveDist = BASE_MOVE_SPEED * 0.5;
        const nextX = enemy.x + Math.cos(enemy.moveDir) * moveDist;
        const nextY = enemy.y + Math.sin(enemy.moveDir) * moveDist;
        if (!isWall(nextX, enemy.y)) enemy.x = nextX;
        if (!isWall(enemy.x, nextY)) enemy.y = nextY;
        enemy.moveTimer--;
      }
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const prevX = b.x;
        const prevY = b.y;
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;

        const steps = 70;
        let hitWall = false;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const checkX = prevX + (b.x - prevX) * t;
          const checkY = prevY + (b.y - prevY) * t;
          if (isWall(checkX, checkY)) {
            hitWall = true;
            spawnWallHitParticle(checkX, checkY, "#31c5ff", 0.03, 30); // single fading circle
            break;
          }
        }
        if (hitWall) {
          bullets.splice(i, 1);
          continue;
        }
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = b.x - enemy.x;
          const dy = b.y - enemy.y;
          if (Math.hypot(dx, dy) < enemy.size) {
            enemy.alive = false;
            gameState.stats.money += CONFIG.MONEY_PER_KILL * gameState.stats.moneyMultiplier;
            spawnParticles(enemy.x, enemy.y, "red", 15, 0.05, 0.1, 30);
            bullets.splice(i, 1);
            break;
          }
        }
      }
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        const prevX = b.x;
        const prevY = b.y;
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;

        const steps = 70;
        let hitWall = false;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const checkX = prevX + (b.x - prevX) * t;
          const checkY = prevY + (b.y - prevY) * t;
          if (isWall(checkX, checkY)) {
            hitWall = true;
            spawnWallHitParticle(checkX, checkY, "yellow", 0.03, 20); // single fading circle
            break;
          }
        }
        if (hitWall) {
          enemyBullets.splice(i, 1);
          continue;
        }
        const dx = b.x - PLAYER.x;
        const dy = b.y - PLAYER.y;
        if (Math.hypot(dx, dy) < 0.3) { // hit player
          enemyBullets.splice(i, 1);
          gameState.effects.damageFlash = 10;
          loseLife();
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
          mouseSensitivity,
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
