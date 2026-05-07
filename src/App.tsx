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

let scoreboard = 0;
const lives = [true, true, true];
//wymiary ekranu
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
//predkosc gracza i kamery
const MOVE_SPEED = 0.034;
const ROT_SPEED = 0.04;
//pole widzenia
const FOV = Math.PI / 2;

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
//przeciwnicy
for (let i = 0; i < 5; i++) {
  while (true) {
    const x = Math.floor(Math.random() * (MAP[0].length-2)) + 1 + 0.5;
    const y = Math.floor(Math.random() * (MAP.length-2)) + 1 + 0.5;
    if (MAP[Math.floor(y)][Math.floor(x)] === 0) {
      enemies.push({ x, y, cooldown: Math.random() * 100 + 50, size: 0.4, alive: true });
      break;
    }
  }
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
  for (let i = lives.length - 1; i >= 0; i--) {
    if (lives[i]) {
      lives[i] = false;
      PLAYER.x = spawn.x;
      PLAYER.y = spawn.y;
      return;
    }
  }
  alert(`Game Over! Score: ${scoreboard}`);
  window.location.reload();
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
        moveX += Math.cos(PLAYER.angle) * MOVE_SPEED;
        moveY += Math.sin(PLAYER.angle) * MOVE_SPEED;
      }
      if (keys["s"]) {
        moveX -= Math.cos(PLAYER.angle) * MOVE_SPEED;
        moveY -= Math.sin(PLAYER.angle) * MOVE_SPEED;
      }
      if (keys["a"]) {
        moveX += Math.cos(PLAYER.angle-Math.PI / 2) * MOVE_SPEED;
        moveY += Math.sin(PLAYER.angle -Math.PI / 2) * MOVE_SPEED;
      }
      if (keys["d"]) {
        moveX += Math.cos(PLAYER.angle+Math.PI / 2) * MOVE_SPEED;
        moveY += Math.sin(PLAYER.angle + Math.PI / 2) * MOVE_SPEED;
      }
      if (keys[" "]) {
        keys[" "] = false;
        bullets.push({
          x: PLAYER.x,
          y: PLAYER.y,
          angle: PLAYER.angle,
          speed: BULLET_SPEED,
          distance: 0,
        });
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
        if (enemy.cooldown <= 0) {
          const angle = Math.atan2(PLAYER.y - enemy.y, PLAYER.x - enemy.x);
          enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            angle,
            speed: BULLET_SPEED * 0.8,
            distance: 0,
          });
          enemy.cooldown = Math.random() * 100 + 50;
        }
        //prosty ruch losowy
        const moveAngle = Math.random() * Math.PI * 2;
        const moveDist = MOVE_SPEED*2;
        const nextX = enemy.x + Math.cos(moveAngle) * moveDist;
        const nextY = enemy.y + Math.sin(moveAngle) * moveDist;
        if (!isWall(nextX, enemy.y)) enemy.x = nextX;
        if (!isWall(enemy.x, nextY)) enemy.y = nextY;
      }
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.distance += b.speed;
        if (isWall(b.x, b.y)) {
          bullets.splice(i, 1);
        }
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = b.x - enemy.x;
          const dy = b.y - enemy.y;
          if (Math.hypot(dx, dy) < enemy.size) {
            enemy.alive = false;
            scoreboard+=100;
            bullets.splice(i, 1);
            break;
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
        if (Math.hypot(dx, dy) < 0.3) { // hit player
          enemyBullets.splice(i, 1);
          loseLife();
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
    }
    //minimapa
    function drawMinimap() {
      const size = 16;
      for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[y].length; x++) {
          if (MAP[y][x] === 1) {
            ctx.fillStyle = "white";
          } else {
            ctx.fillStyle = "#111";
          }
          ctx.fillRect(x * size, y * size,size,size);
        }
      }

      ctx.fillStyle = "#22ff00";
      ctx.beginPath();
      ctx.arc(PLAYER.x * size, PLAYER.y * size, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#22ff00";
      ctx.beginPath();
      ctx.moveTo(PLAYER.x * size, PLAYER.y * size);
      ctx.lineTo(
          (PLAYER.x + Math.cos(PLAYER.angle)) * size,
          (PLAYER.y + Math.sin(PLAYER.angle)) * size
      );
      ctx.stroke();
      ctx.fillStyle = "#31c5ff";
      for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x * 16, b.y * 16, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        ctx.fillStyle = "red";
        ctx.fillRect(
            (enemy.x - 0.25) * size,
            (enemy.y - 0.25) * size,
            size * 0.5,
            size * 0.5
        );
      }
      for (const e of enemyBullets) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(e.x * 16, e.y * 16, 2, 0, Math.PI * 2);
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