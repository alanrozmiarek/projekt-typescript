import {gameState} from "./gameState.ts";
import type {Bullet, Particle} from "../App.tsx";
import type {Player} from "./gameState.ts";
import type {Shop} from "./shop.ts";
import type {Enemy, EnemyBullet} from "./enemies.ts";

function angleDiff(a: number, b: number) {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
}
export function render3D({
    ctx,
    player,
    enemies,
    bullets,
    enemyBullets,
    particles,
    castRay,
    shop,
    screen,
}: {
    ctx: CanvasRenderingContext2D;
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    enemyBullets: EnemyBullet[];
    particles: Particle[];
    castRay: (x: number, y: number, angle: number) => number;
    shop: Shop;
    screen: {width:number, height:number};
}) {
    //niebo
    ctx.fillStyle = "#373737";
    ctx.fillRect(0, 0, screen.width, screen.height/2);
    //podloga
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, screen.height/2, screen.width, screen.height/2);
    const RAY_STEP = 2;
    for (let x = 0; x < screen.width; x += RAY_STEP){
        const angle = player.angle - gameState.stats.FOV/2 + (x/screen.width) * gameState.stats.FOV;
        let distance = castRay(player.x, player.y, angle);
        distance *= Math.cos(player.angle-angle);
        const wallHeight = (screen.height * 0.8)/distance;
        const shade = 255-distance * 25;
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(x, screen.height/2-wallHeight/2, RAY_STEP, wallHeight);
    }
    for (const b of bullets) {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const angleToBullet = Math.atan2(dy, dx);
        const distanceToBullet = Math.hypot(dx, dy);
        const diff = angleDiff(angleToBullet, player.angle);
        if (Math.abs(diff) < gameState.stats.FOV / 2) {
            const wallDistance = castRay(player.x, player.y, angleToBullet);
            if (distanceToBullet < wallDistance) {
                const projHeight = (screen.height / 16) / distanceToBullet;
                ctx.fillStyle = "#31c5ff";
                const screenX = (diff + gameState.stats.FOV / 2) / gameState.stats.FOV * screen.width;
                ctx.fillRect(screenX, screen.height / 2 - projHeight / 2, 4, projHeight);
            }
        }
    }
    //sklep
    {
        const dx = shop.x - player.x;
        const dy = shop.y - player.y;
        const angleToShop = Math.atan2(dy, dx);
        const distanceToShop = Math.hypot(dx, dy);
        const diff = angleDiff(angleToShop, player.angle);
        if (Math.abs(diff) < gameState.stats.FOV / 2) {
            const wallDistance = castRay(player.x, player.y, angleToShop);
            if (distanceToShop < wallDistance) {
                const screenX = (diff + gameState.stats.FOV / 2) / gameState.stats.FOV * screen.width;
                ctx.fillStyle = "yellow";
                ctx.fillRect(screenX, (screen.height/2), 128/distanceToShop, (screen.height/2)/distanceToShop);
            }
        }
    }
    for (const enemy of enemies) {//rysowanie przeciwników
        if (!enemy.alive) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const angleToEnemy = Math.atan2(dy, dx);
        const distanceToEnemy = Math.hypot(dx, dy);
        const diff = angleDiff(angleToEnemy, player.angle);
        if (Math.abs(diff) < gameState.stats.FOV / 2) {
            const wallDistance = castRay(player.x, player.y, angleToEnemy);
            if (distanceToEnemy < wallDistance) {
                const screenX = (diff + gameState.stats.FOV / 2) / gameState.stats.FOV * screen.width;
                ctx.fillStyle = "red";
                ctx.fillRect(screenX, screen.height/2, 128/distanceToEnemy, (screen.height/2)/distanceToEnemy);
            }
        }
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const angleToBullet = Math.atan2(dy, dx);
        const distanceToBullet = Math.hypot(dx, dy);
        const diff = angleDiff(angleToBullet, player.angle);
        if (Math.abs(diff) < gameState.stats.FOV / 2) {
            const wallDistance = castRay(player.x, player.y, angleToBullet);
            if (distanceToBullet < wallDistance) {
                const projHeight = (screen.height / 16) / distanceToBullet;
                const screenX = (diff + gameState.stats.FOV / 2) / gameState.stats.FOV * screen.width;
                ctx.fillStyle = "yellow";
                ctx.fillRect(screenX, screen.height / 2 - projHeight/2, 4, projHeight);
            }
        }
    }


    for (const p of particles) {//efekty
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const angleToParticle = Math.atan2(dy, dx);
        const distanceToParticle = Math.hypot(dx, dy);
        const diff = angleDiff(angleToParticle, player.angle);
        if (Math.abs(diff) < gameState.stats.FOV / 2) {
            const wallDistance = castRay(player.x, player.y, angleToParticle);
            if (distanceToParticle < wallDistance) {
                const screenX = (diff + gameState.stats.FOV / 2) / gameState.stats.FOV * screen.width;
                const projSize = (p.radius * screen.height) / distanceToParticle; // scale by distance
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(p.lifetime / 30, 0); // fade out
                ctx.beginPath();
                ctx.arc(screenX, screen.height / 2, projSize*3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }
    if (gameState.effects.damageFlash > 0) { //efekt obrazen
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.fillRect(0, 0, screen.width, screen.height);
        gameState.effects.damageFlash--;
    }

}
