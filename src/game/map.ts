export type MapGrid = number[][];
export function createMap() {//generator lososwej mapy
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