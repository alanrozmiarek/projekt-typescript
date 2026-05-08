import { useEffect, useRef } from "react";
import "./App.css";

type MapGrid = number[][];
type Bullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};
const bullets: Bullet[] = [];
const BULLET_SPEED = 0.2;

type Enemy = {
  x: number;
  y: number;
  cooldown: number;
  size: number;
  alive: boolean;
  moveDir: number;
  moveTimer: number;
};
const enemies: Enemy[] = [];

type EnemyBullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};
const enemyBullets: EnemyBullet[] = [];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  lifetime: number;
};
const particles: Particle[] = [];

let scoreboard = 0;
const lives = [true, true, true];
let damageFlash = 0;
let playerShootCooldown = 0;
const PLAYER_SHOOT_DELAY = 15;
//wymiary ekranu
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
//predkosc gracza i kamery
const MOVE_SPEED = 0.034;
const ROT_SPEED = 0.04;
//pole widzenia
const FOV = Math.PI / 2;
const MINIMAP_SIZE = 400;

const keys: Record<string, boolean> = {};

function createMap() {//generator lososwej mapy
  while (true) {
    const width = Math.floor(Math.random() * 10) + 15;
    const height = Math.floor(Math.random() * 10) + 15;
    const map: MapGrid = [];

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        //sciany
        if (x === 0 || y === 0 || x === width-1 || y === height-1) {
          row.push(1);
        } else {
          if (Math.random() < 0.25) {
            row.push(1);
          } else {
            row.push(0);
          }
        }
      }

      map.push(row);
    }
    //usuwanie zamknietych pokoi
    let startX = 1;
    let startY = 1;
    let found = false;
    for (let y = 1; y < height-1; y++) {
      for (let x = 1; x < width-1; x++) {
        if (map[y][x] === 0) {
          startX = x;
          startY = y;
          found = true;
          break;
        }
      }
      if (found) {
        break;
      }
    }
    const visited: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      visited[y] = [];
      for (let x = 0; x < width; x++) {
        visited[y][x] = false;
      }
    }
    const queue: [number, number][] = [];
    queue.push([startX, startY]);
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const current = queue.shift();

      if (!current) continue;
      const [x, y] = current;
      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];

      for (const dir of directions) {
        const nx = x + dir[0];
        const ny = y + dir[1];
        if (
            nx >= 0 &&
            ny >= 0 &&
            nx < width &&
            ny < height &&
            map[ny][nx] === 0 &&
            !visited[ny][nx]
        ) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }

    for (let y = 1; y < height-1; y++) {
      for (let x = 1; x < width -1; x++) {
        if (map[y][x] === 0 && !visited[y][x]) {
          map[y][x] = 1;
        }
      }
    }
    let freeSpaces = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === 0) {
          freeSpaces++;
        }
      }
    }
    // jezeli mapa ma minimum 15 wolnych miejsc
    if (freeSpaces >= 15) {
      return map;
    }
  }
}

const MAP = createMap();

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

const PLAYER = {
  x: spawn.x,
  y: spawn.y,
  angle: Math.random() * Math.PI * 2,
};
function spawnEnemy(minDistance = 5): Enemy {//przeciwnicy
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
        size: 0.4,
        alive: true,
        moveDir: 0,
        moveTimer: 10,
      };
    }
  }
}
for (let i = 0; i < 5; i++) {
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
  for (let i = 0; i < lives.length; i++){
    if (lives[i]) {
      lives[i] = false;
      return;
    }
  }
  alert(`Game Over! Score: ${scoreboard}`);
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
function castRay(angle: number) {
  let distance = 0;

  while (distance < 20) {
    const rayX = PLAYER.x + Math.cos(angle) * distance;
    const rayY = PLAYER.y + Math.sin(angle) * distance;

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
  const distanceToWall = castRay(angle);
  return distanceToPlayer <= distanceToWall;
}
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const keyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };
    const keyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    function update() {
      if (keys["arrowleft"]) {
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
      const length = Math.hypot(moveX, moveY);
      if (length > 0) {
        moveX = (moveX / length) * MOVE_SPEED;
        moveY = (moveY / length) * MOVE_SPEED;
      }

      if (playerShootCooldown > 0) playerShootCooldown--;
      if (keys[" "] && playerShootCooldown <= 0){
        bullets.push({
          x: PLAYER.x,
          y: PLAYER.y,
          angle: PLAYER.angle,
          speed: BULLET_SPEED,
          distance: 0,
        });
        playerShootCooldown = PLAYER_SHOOT_DELAY;
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
        enemy.cooldown--;
        if (enemy.cooldown <= 0 && canSeePlayer(enemy)) {
          const angle = Math.atan2(PLAYER.y - enemy.y, PLAYER.x - enemy.x);
          enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            angle,
            speed: BULLET_SPEED * 0.4,
            distance: 0,
          });
          enemy.cooldown = Math.random() * 100 + 50;
        }
        //ruch
        if (!enemy.moveDir || enemy.moveTimer <= 0) {
          enemy.moveDir = Math.random() * Math.PI * 2;
          enemy.moveTimer = Math.floor(Math.random() * 60 + 30); // move 0.5-1s at 60fps
        }
        const moveDist = MOVE_SPEED * 0.5;
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
            scoreboard += 100;
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
          damageFlash = 10;
          loseLife();
        }
      }
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length === 0) {
        enemies.length = 0;
        for (let i = lives.length - 1; i >= 0; i--) {
          if (!lives[i]) {
            lives[i] = true;
            break;
          }
        }
        for (let i = 0; i < 5; i++) {
          enemies.push(spawnEnemy(7));
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
    function angleDiff(a: number, b: number) {
      let diff = a - b;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return diff;
    }
    function render3D() {
      //niebo
      ctx.fillStyle = "#373737";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT/2);
      //podloga
      ctx.fillStyle = "#222222";
      ctx.fillRect(0, SCREEN_HEIGHT/2, SCREEN_WIDTH, SCREEN_HEIGHT/2);
      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const angle = PLAYER.angle - FOV/2 + (x/SCREEN_WIDTH) * FOV;
        let distance = castRay(angle);
        distance *= Math.cos(PLAYER.angle-angle);
        const wallHeight = (SCREEN_HEIGHT * 0.8)/distance;
        const shade = 255-distance * 25;
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(x, SCREEN_HEIGHT/2-wallHeight/2, 1, wallHeight);
      }
      for (const b of bullets) {
        const dx = b.x - PLAYER.x;
        const dy = b.y - PLAYER.y;
        const angleToBullet = Math.atan2(dy, dx);
        const distanceToBullet = Math.hypot(dx, dy);
        const diff = angleDiff(angleToBullet, PLAYER.angle);
        if (Math.abs(diff) < FOV / 2) {
          const wallDistance = castRay(angleToBullet);
          if (distanceToBullet < wallDistance) {
            const projHeight = (SCREEN_HEIGHT / 16) / distanceToBullet;
            ctx.fillStyle = "#31c5ff";
            const screenX = (diff + FOV / 2) / FOV * SCREEN_WIDTH;
            ctx.fillRect(screenX, SCREEN_HEIGHT / 2 - projHeight / 2, 4, projHeight);
          }
        }
      }

      for (const enemy of enemies) {//rysowaine przeciwników
        if (!enemy.alive) continue;
        const dx = enemy.x - PLAYER.x;
        const dy = enemy.y - PLAYER.y;
        const angleToEnemy = Math.atan2(dy, dx);
        const distanceToEnemy = Math.hypot(dx, dy);
        const diff = angleDiff(angleToEnemy, PLAYER.angle);
        if (Math.abs(diff) < FOV / 2) {
          const wallDistance = castRay(angleToEnemy);
          if (distanceToEnemy < wallDistance) {
            const screenX = (diff + FOV / 2) / FOV * SCREEN_WIDTH;
            ctx.fillStyle = "red";
            ctx.fillRect(screenX, SCREEN_HEIGHT/2, 64/distanceToEnemy, (SCREEN_HEIGHT/2)/distanceToEnemy);
          }
        }
      }
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;
        if (isWall(b.x, b.y)) {
          enemyBullets.splice(i, 1);
          continue;
        }
        const dx = b.x - PLAYER.x;
        const dy = b.y - PLAYER.y;
        const angleToBullet = Math.atan2(dy, dx);
        const distanceToBullet = Math.hypot(dx, dy);
        const diff = angleDiff(angleToBullet, PLAYER.angle);
        if (Math.abs(diff) < FOV / 2) {
          const wallDistance = castRay(angleToBullet);
          if (distanceToBullet < wallDistance) {
            const projHeight = (SCREEN_HEIGHT / 16) / distanceToBullet;
            const screenX = (diff + FOV / 2) / FOV * SCREEN_WIDTH;
            ctx.fillStyle = "yellow";
            ctx.fillRect(screenX, SCREEN_HEIGHT / 2 - projHeight/2, 4, projHeight);
          }
        }
      }
      //hud
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "right";
      ctx.fillText(`Score: ${scoreboard}`, SCREEN_WIDTH - 20, 30);
      for (let i = 0; i < lives.length; i++) {
        ctx.fillStyle = lives[i] ? "red" : "#555";
        ctx.fillRect(SCREEN_WIDTH - 40 - i * 25, 40, 20, 20);
      }
      for (const p of particles) {//efekty
        const dx = p.x - PLAYER.x;
        const dy = p.y - PLAYER.y;
        const angleToParticle = Math.atan2(dy, dx);
        const distanceToParticle = Math.hypot(dx, dy);
        const diff = angleDiff(angleToParticle, PLAYER.angle);
        if (Math.abs(diff) < FOV / 2) {
          const wallDistance = castRay(angleToParticle);
          if (distanceToParticle < wallDistance) {
            const screenX = (diff + FOV / 2) / FOV * SCREEN_WIDTH;
            const projSize = (p.radius * SCREEN_HEIGHT) / distanceToParticle; // scale by distance
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(p.lifetime / 30, 0); // fade out
            ctx.beginPath();
            ctx.arc(screenX, SCREEN_HEIGHT / 2, projSize*3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
      if (damageFlash > 0) { //efekt obrazen
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        damageFlash--;
      }
      const size = 10; //celownik
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
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
    //minimapa

    function drawMinimap() {
      const scaleX = MINIMAP_SIZE / MAP[0].length;
      const scaleY = MINIMAP_SIZE / MAP.length;
      const tileSize = Math.min(scaleX, scaleY);
      for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[y].length; x++) {
          ctx.fillStyle = MAP[y][x] === 1 ? "white" : "#111";
          ctx.fillRect(x * tileSize,y * tileSize, tileSize, tileSize);
        }
      }
      // Player
      ctx.fillStyle = "#22ff00";
      ctx.beginPath();
      ctx.arc(PLAYER.x * tileSize, PLAYER.y * tileSize, tileSize / 4, 0, Math.PI * 2);
      ctx.fill();
      // Player direction line
      ctx.strokeStyle = "#22ff00";
      ctx.beginPath();
      ctx.moveTo(PLAYER.x * tileSize, PLAYER.y * tileSize);
      ctx.lineTo(
          (PLAYER.x + Math.cos(PLAYER.angle)) * tileSize,
          (PLAYER.y + Math.sin(PLAYER.angle)) * tileSize
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
    function gameLoop() {
      update();
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      render3D();
      drawMinimap();
      requestAnimationFrame(gameLoop);
    }
    gameLoop();

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  return (
      <div className="back">
        <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}/>
      </div>
  );
}