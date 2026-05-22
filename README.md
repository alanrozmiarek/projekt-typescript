# Browser FPS Roguelike

Prosta gra FPS roguelike napisana w React i TypeScript. Gra działa w przeglądarce i używa Canvas API do renderowania pseudo-3D, minimapy oraz interfejsu.

Gracz porusza się po losowo generowanej mapie, strzela do przeciwników, zdobywa pieniądze, kupuje ulepszenia i próbuje przetrwać jak najdłużej.

## Funkcje

- Losowo generowana mapa przy każdym uruchomieniu gry
- Pseudo-3D renderowane za pomocą raycastingu na Canvasie
- Strzelanie, pociski gracza i pociski przeciwników
- Przeciwnicy z opóźnieniem reakcji po zauważeniu gracza
- System fal przeciwników
- Ulepszenia po zakończeniu fali
- Klątwy co kilka fal
- Sklep z dynamicznie skalowanymi cenami
- System życia, pieniędzy i mnożników
- Efekty cząsteczkowe przy trafieniach i uderzeniach w ściany
- Minimapka pokazująca mapę, gracza, przeciwników, pociski i sklep
- Menu pauzy z ustawieniami czułości myszy i limitu cząsteczek

## Sterowanie

| Klawisz / akcja | Działanie |
| --- | --- |
| `W` | Ruch do przodu |
| `S` | Ruch do tyłu |
| `A` | Ruch w lewo |
| `D` | Ruch w prawo |
| Mysz | Obrót kamery w poziomie |
| Lewy przycisk myszy | Strzał |
| `Spacja` | Strzał |
| `E` | Otwórz / zamknij sklep, gdy gracz jest blisko |
| `Enter` | Potwierdzenie wyboru w menu |
| `Esc` | Pauza / powrót |

## Menu pauzy

W menu pauzy można wejść do ustawień i zmienić parametry działania gry.

| Klawisz | Działanie |
| --- | --- |
| `Enter` | Wejście do ustawień |
| `W` / `S` albo strzałki góra/dół | Wybór ustawienia |
| `A` / `D` albo strzałki lewo/prawo | Zmiana wartości |
| `Enter` / `Esc` | Powrót z ustawień |

Dostępne ustawienia:

- czułość myszy
- maksymalna liczba cząsteczek

## Sklep

Sklep pojawia się na mapie jako żółty obiekt. Po podejściu do niego można nacisnąć `E`, aby otworzyć menu sklepu.

W sklepie można:

- kupować ulepszenia za pieniądze zdobyte za zabijanie przeciwników
- przerzucać ofertę sklepu
- kupować ulepszenia standardowe oraz specjalne ulepszenia sklepowe

Ceny skalują się dynamicznie na podstawie:

- rzadkości ulepszenia
- liczby wcześniejszych zakupów
- aktualnego mnożnika pieniędzy gracza

## Ulepszenia i klątwy

Po zakończeniu fali gra pokazuje wybór ulepszeń. Ulepszenia mogą zwiększać między innymi:

- szybkość strzelania
- liczbę pocisków
- prędkość ruchu
- prędkość pocisków
- mnożnik pieniędzy
- liczbę żyć

Co kilka fal zamiast zwykłego ulepszenia pojawia się wybór klątwy. Klątwy utrudniają grę, ale mogą też zmieniać tempo rozgrywki.

## Jak działa gra

Gra jest podzielona na kilka modułów w katalogu `src/game`.

| Plik | Odpowiedzialność |
| --- | --- |
| `map.ts` | Generowanie losowej mapy |
| `render.tsx` | Renderowanie pseudo-3D |
| `ui.ts` | HUD, minimapa i menu |
| `enemies.ts` | Typy przeciwników, spawn i logika przeciwników |
| `upgrades.ts` | Lista ulepszeń i klątw |
| `shop.ts` | Sklep i skalowanie cen |
| `gameState.ts` | Wspólny stan gry |

Renderowanie 3D bazuje na prostym raycastingu. Pociski oraz ruch gracza mają detekcję kolizji krokową, żeby ograniczyć błędy przy bardzo wysokiej prędkości.

## Uruchamianie projektu

Zainstaluj zależności:

```bash
npm install
```

Uruchom serwer developerski:

```bash
npm run dev
```

Zbuduj wersję produkcyjną:

```bash
npm run build
```

Uruchom linter:

```bash
npm run lint
```

## Konfiguracja

Część parametrów gry można zmienić w pliku `.env`.

Przykładowe ustawienia:

```env
VITE_PLAYER_SHOOT_DELAY=120
VITE_BASE_BULLET_SPEED=0.2
VITE_BASE_MOVE_SPEED=0.017
VITE_ROT_SPEED=0.02
VITE_FOV=1.5708
VITE_STARTING_LIVES=3
VITE_STARTING_ENEMIES=1
VITE_MONEY_PER_KILL=1
```

Po zmianie `.env` trzeba ponownie uruchomić serwer developerski.
