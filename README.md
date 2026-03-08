# Aplikacija za upravljanje uvozom

Web aplikacija za upravljanje procesom uvoza robe iz inostranstva.  
Projekat je razvijen u okviru predmeta **Internet tehnologije**.

Aplikacija omogućava saradnju između **uvoznika i dobavljača**, upravljanje proizvodima, kreiranje kontejnera za transport robe, generisanje faktura i analizu prodaje.

Repozitorijum:  
https://github.com/elab-development/internet-tehnologije-2025-apilkacijazauvoznike_2022_0078

# Tehnologije

Aplikacija je razvijena korišćenjem sledećih tehnologija:

Frontend i Backend
- Next.js
- React
- TypeScript

Baza podataka
- PostgreSQL
- Drizzle ORM

DevOps
- Docker
- Docker Compose

U projektu je obezbeđena API specifikacija (**Swagger**) i integrisana su dva eksterna API-a (**Google Charts, Frankfurter**).

# Arhitektura aplikacije

Aplikacija koristi **Next.js full stack arhitekturu**.

Struktura backend logike:
API Route → Controller → Baza podataka

- API rute primaju HTTP zahteve
- kontroleri implementiraju poslovnu logiku
- Drizzle ORM komunicira sa PostgreSQL bazom

Autentifikacija je implementirana pomoću **JWT tokena i HTTP-only cookies**.

# Korisničke uloge

Sistem podržava tri tipa korisnika:

### Admin
- upravljanje korisnicima
- kontrola sistema

### Uvoznik
- upravljanje saradnjama
- pregled proizvoda dobavljača sa kojima sarađuje
- poređenje ponuda dobavljača
- kreiranje i upravljanje kontejnerima
- dodavanje proizvoda u kontejner
- checkout i generisanje faktura
- analitika kupovine

### Dobavljač
- upravljanje saradnjama
- upravljanje kategorijama proizvoda
- upravljanje proizvodima
- pregled analitike prodaje

# Glavne funkcionalnosti

Aplikacija omogućava:

Autentifikaciju korisnika
- registracija
- login
- logout

Upravljanje proizvodima
- dodavanje proizvoda
- izmena proizvoda
- brisanje proizvoda
- pregled proizvoda
- poređenje proizvoda

Upravljanje kategorijama
- dodavanje kategorija
- izmena kategorija
- brisanje kategorija

Saradnje između uvoznika i dobavljača
- uspostavljanje saradnje
- otkazivanje saradnje
- ograničavanje pregleda proizvoda samo na dobavljače sa kojima postoji saradnja

Kontejner sistem
- dodavanje proizvoda u kontejner
- automatsko računanje zapremine
- raspodela proizvoda po kontejnerima
- obračun cene kontejnera

Checkout proces
- obračun carine
- obračun ukupnih troškova uvoza
- generisanje faktura

Analitika za uvoznika
- analiza kupovine po mesecima
- analiza potrošnje po dobavljačima
- analiza najčešće kupljenih proizvoda

Analitika za dobavljača
- prodaja po mesecima
- najprodavaniji proizvodi
- prihod po proizvodima

# Eksterni API servisi

Aplikacija koristi dva eksterna API servisa:

### Frankfurter API
Koristi se za konverziju valuta prilikom prikaza cena proizvoda.

https://www.frankfurter.app

### Google Charts
Koristi se za vizualizaciju statističkih podataka i analitike.

https://developers.google.com/chart

# Vizualizacija podataka

Aplikacija koristi **Google Charts** za grafički prikaz podataka.

Implementirani grafici:

- kupovina po mesecima
- potrošnja po dobavljačima
- najčešće kupljeni proizvodi
- prodaja dobavljača po mesecima
- najprodavaniji proizvodi dobavljača
- prihod po proizvodima

# Pokretanje aplikacije

## Pokretanje pomoću Docker-a

Najjednostavniji način pokretanja aplikacije je pomoću Docker-a.

Pokrenuti sledeću komandu u root folderu projekta:
docker compose up --build

Ova komanda pokreće:

- PostgreSQL bazu
- aplikacioni server

## Environment promenljive

Potrebno je kreirati `.env` fajl u root folderu projekta na osnovu `.env.example` fajla.

# API dokumentacija

API dokumentacija je dostupna putem **Swagger** alata.

Swagger omogućava:

- pregled API ruta
- testiranje API zahteva
- pregled strukture request i response objekata

# Git grane

Projekat koristi sledeću strategiju grana:

- **main** – stabilna verzija aplikacije
- **develop** – integraciona grana
- **feature/ ili feat/** – grane za razvoj novih funkcionalnosti

# Autori

Studenti:

- Ognjen Lekovski
- Petar Lović
- Aleksej Stojanović

Fakultet organizacionih nauka  
Predmet: Internet tehnologije