Gra FPS 3D w przeglądarce

Prosta gra FPS w React i TypeScript, która działa w przeglądarce. 
Chodzisz, strzelasz do przeciwników i starasz się przetrwać jak najdłużej i zdobyc jak największy wynik.

Gra generuje losową mapę, po której porusza się gracz oraz wrogowie.
Ma prostą grafikę w stylu 3D, a także minimapę ułatwiającą orientację w poziomie.

Sterowanie
Klawisz	Funkcja
W	Ruch do przodu
S	Ruch do tyłu
A	Ruch w lewo
D	Ruch w prawo
Strzałka w lewo Obrót gracza w lewo
Strzałka w prawo    Obrót gracza w prawo
Spacja  Strzał

Funkcje
Losowa mapa przy każdym uruchomieniu gry
Strzelanie do przeciwników i ich AI z możliwością strzału w gracza
Efekty cząsteczkowe przy trafieniach i uderzeniach w ściany
System życia i punktów
Prostokątna minimapa w rogu ekranu
Prosty HUD pokazujący punkty i życie

Jak gra działa
Gra używa React i Canvas API do renderowania 3D i minimapy.
Mapy są generowane losowo przy każdym uruchomieniu, z gwarancją minimum 15 wolnych pól.
Przeciwnicy poruszają się losowo i strzelają, jeśli widzą gracza.
Pociski gracza i wrogów mają detekcję kolizji z ścianami i przeciwnikami.
Efekty wizualne i animacje są tworzone jako cząsteczki.
Gra kończy się, gdy wszystkie życia gracza zostaną utracone.