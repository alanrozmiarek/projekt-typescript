import { CONFIG } from "../config.ts";
import type { Player } from "./gameState.ts";

export type EnemyKind = "shooter";

type EnemyDefinition = {
  size: number;
  moveSpeedMultiplier: number;
  bulletSpeedMultiplier: number;
  reactionTime: number;
  minCooldown: number;
  maxCooldown: number;
};

const ENEMY_DEFINITIONS: Record<EnemyKind, EnemyDefinition> = {
  shooter: {
    size: CONFIG.ENEMY_SIZE,
    moveSpeedMultiplier: 0.5,
    bulletSpeedMultiplier: 0.4,
    reactionTime: CONFIG.ENEMY_REACTION_TIME,
    minCooldown: 50,
    maxCooldown: 150,
  },
};

export type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  cooldown: number;
  size: number;
  alive: boolean;
  moveDir: number;
  moveTimer: number;
  reactionTimer: number;
};

export type EnemyBullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
};

export function spawnEnemy({
  map,
  player,
  minDistance = CONFIG.ENEMY_MIN_DISTANCE,
  kind = "shooter",
}: {
  map: number[][];
  player: Player;
  minDistance?: number;
  kind?: EnemyKind;
}): Enemy {
  const definition = ENEMY_DEFINITIONS[kind];

  while (true) {
    const x = Math.floor(Math.random() * (map[0].length - 2)) + 1 + 0.5;
    const y = Math.floor(Math.random() * (map.length - 2)) + 1 + 0.5;

    if (map[Math.floor(y)][Math.floor(x)] !== 0) continue;

    const dx = x - player.x;
    const dy = y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= minDistance) {
      return {
        kind,
        x,
        y,
        cooldown: getEnemyCooldown(definition),
        size: definition.size,
        alive: true,
        moveDir: 0,
        moveTimer: 10,
        reactionTimer: definition.reactionTime,
      };
    }
  }
}

function getEnemyDefinition(enemy: Enemy) {
  return ENEMY_DEFINITIONS[enemy.kind];
}

function getEnemyCooldown(definition: EnemyDefinition) {
  return Math.random() * (definition.maxCooldown - definition.minCooldown) + definition.minCooldown;
}

export function canSeePlayer({
  enemy,
  player,
  castRay,
}: {
  enemy: Enemy;
  player: Player;
  castRay: (x: number, y: number, angle: number) => number;
}) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const angle = Math.atan2(dy, dx);
  const distanceToPlayer = Math.hypot(dx, dy);
  const distanceToWall = castRay(enemy.x, enemy.y, angle);

  return distanceToPlayer <= distanceToWall;
}

export function updateEnemies({
  enemies,
  enemyBullets,
  player,
  isWall,
  castRay,
}: {
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  player: Player;
  isWall: (x: number, y: number) => boolean;
  castRay: (x: number, y: number, angle: number) => number;
}) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const definition = getEnemyDefinition(enemy);

    if (canSeePlayer({ enemy, player, castRay })) {
      if (enemy.reactionTimer > 0) {
        enemy.reactionTimer--;
      } else {
        enemy.cooldown--;
      }
    } else {
      enemy.reactionTimer = definition.reactionTime;
    }

    if (enemy.cooldown <= 0 && enemy.reactionTimer <= 0) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        angle,
        speed: CONFIG.BASE_BULLET_SPEED * definition.bulletSpeedMultiplier,
        distance: 0,
      });
      enemy.cooldown = getEnemyCooldown(definition);
    }

    if (!enemy.moveDir || enemy.moveTimer <= 0) {
      enemy.moveDir = Math.random() * Math.PI * 2;
      enemy.moveTimer = Math.floor(Math.random() * 60 + 30);
    }

    const moveDist = CONFIG.BASE_MOVE_SPEED * definition.moveSpeedMultiplier;
    const nextX = enemy.x + Math.cos(enemy.moveDir) * moveDist;
    const nextY = enemy.y + Math.sin(enemy.moveDir) * moveDist;

    if (!isWall(nextX, enemy.y)) enemy.x = nextX;
    if (!isWall(enemy.x, nextY)) enemy.y = nextY;
    enemy.moveTimer--;
  }
}
