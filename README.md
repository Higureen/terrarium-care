# TerraCare – zoologijos sodo terariumų ir augintinių priežiūros sistema

## Sistemos paskirtis

TerraCare leidžia zoologijos sodo darbuotojams tvarkyti terariumų,
juose gyvenančių augintinių ir jų priežiūros informaciją.

Terariumams saugomos temperatūros ir drėgmės ribos, paskutinio valymo
data bei pastabos. Augintiniams saugomi vardai, rūšys, atvykimo datos
ir pastabos. Priežiūros įrašuose registruojamas maitinimas, būklės
stebėjimas ir kiti priežiūros veiksmai.

Duomenų hierarchija: **terariumas → augintinis → priežiūros įrašas**.
Abu ryšiai yra vienas su daug.

## Viešai pasiekiama sistema

- Naudotojo sąsaja: https://terracare-bf2v.onrender.com
- REST API: https://terracare-api.onrender.com
- Swagger UI: https://terracare-api.onrender.com/api-docs
- OpenAPI JSON: https://terracare-api.onrender.com/openapi.json
- API ir duomenų bazės būsenos patikrinimas:
  https://terracare-api.onrender.com/health

Frontend, backend ir PostgreSQL duomenų bazė patalpinti Render platformoje.

## Technologijos

- **Vue.js ir Vue Router** – naudotojo sąsaja ir navigacija.
- **JavaScript, HTML ir CSS** – sąsajos logika, struktūra ir stiliai.
- **Vite** – frontend kūrimo aplinka ir produkcinio paketo paruošimas.
- **Node.js ir Express** – REST API ir serverio logika.
- **PostgreSQL** – duomenų saugojimas.
- **JWT ir Argon2id** – autentifikacija ir slaptažodžių maišos.
- **OpenAPI ir Swagger UI** – API dokumentacija.
- **Postman** – API testavimas.
- **Git ir GitHub** – kodo versijų valdymas.
- **Render** – sistemos talpinimas.

## Naudotojų rolės

### Darbuotojas (`worker`)

- Gali prisijungti ir atsijungti.
- Gali peržiūrėti terariumus, jų laikymo sąlygas ir augintinius.
- Gali peržiūrėti augintinių profilius ir priežiūros istoriją.
- Gali kurti priežiūros įrašus.
- Gali redaguoti ir šalinti savo priežiūros įrašus.
- Gali atnaujinti terariumo paskutinio valymo datą.

### Vadovas (`manager`)

- Gali atlikti darbuotojui leidžiamus veiksmus.
- Gali kurti, redaguoti ir šalinti terariumus.
- Gali nustatyti terariumų temperatūros ir drėgmės ribas.
- Gali kurti augintinius pasirinktame terariume, juos redaguoti ir šalinti.
- Gali redaguoti ir šalinti visų darbuotojų priežiūros įrašus.

### Administratorius (`admin`)

- Gali atlikti vadovui leidžiamus veiksmus.
- Gali peržiūrėti naudotojų sąrašą.
- Gali keisti kitų naudotojų roles.
- Gali aktyvuoti ir išjungti kitų naudotojų paskyras.
- Negali per naudotojų valdymo metodą pakeisti savo rolės ar aktyvumo.

Registruojantis sukuriama darbuotojo paskyra. Registracijos užklausoje
negalima pasirinkti aukštesnės rolės.

Paskyros išjungimas nėra jos ištrynimas iš duomenų bazės.

## 1 laboratorinis darbas – REST API

Realizuoti penki pagrindiniai metodai kiekvienam iš trijų objektų:
sąrašo gavimas, vieno objekto gavimas, kūrimas, atnaujinimas ir trynimas.

Papildomai realizuoti terariumo augintinių sąrašas, sudėtinis augintinio
profilis ir hierarchinis priežiūros įrašų sąrašas.

LAB1 apimtį sudaro 18 taikomosios srities API metodų. Vėlesniuose
laboratoriniuose darbuose pridėti autentifikacijos, naudotojų valdymo
ir valymo datos atnaujinimo metodai.

API duomenis grąžina JSON formatu. Sėkmingai ištrynus objektą
grąžinamas `204 No Content` atsakymas be turinio.

### Pagrindiniai API metodai

| Objektas | Sąrašas | Vienas objektas | Kūrimas | Atnaujinimas | Trynimas |
|---|---|---|---|---|---|
| Terariumai | GET /terrariums | GET /terrariums/{id} | POST /terrariums | PUT /terrariums/{id} | DELETE /terrariums/{id} |
| Augintiniai | GET /pets | GET /pets/{id} | POST /pets | PUT /pets/{id} | DELETE /pets/{id} |
| Priežiūros įrašai | GET /care-records | GET /care-records/{id} | POST /care-records | PUT /care-records/{id} | DELETE /care-records/{id} |

### Papildomi taikomosios srities metodai

| Metodas | Paskirtis |
|---|---|
| GET /terrariums/{id}/pets | Konkretaus terariumo augintinių sąrašas. |
| GET /pets/{id}/profile | Augintinio, jo terariumo ir priežiūros įrašų duomenys. |
| GET /terrariums/{terrariumId}/pets/{petId}/care-records | Konkrečiam terariumui priklausančio augintinio priežiūros įrašai. |
| PATCH /terrariums/{id}/last-cleaned | Paskutinio terariumo valymo datos atnaujinimas. |

Hierarchinis metodas patikrina, ar augintinis priklauso nurodytam
terariumui. Jei nepriklauso, grąžinamas `404`.

### Puslapiavimas ir filtravimas

Pagrindiniai sąrašų metodai priima `page` ir `limit` parametrus.

- Numatyta `page=1`.
- Numatyta `limit=5`.
- Didžiausias leidžiamas `limit=100`.
- Naudotojo sąsajos sąrašuose prašoma po 6 įrašus puslapyje.

Filtrai:

- `/terrariums` – pagal pavadinimo dalį (`name`).
- `/pets` – pagal tikslią rūšį, neatsižvelgiant į raidžių dydį (`species`).
- `/care-records` – pagal priežiūros tipą (`care_type`) ir augintinio ID (`pet_id`).

Užklausos pavyzdys:

```http
GET /pets?species=Litoria%20caerulea&page=1&limit=5
```

Sąrašų atsakymuose:

- `data` – įrašai.
- `pagination` – puslapiavimo informacija.
- `_links` – nuorodos į puslapius ir susijusius resursus.

### Duomenų vientisumas

- Terariumo negalima ištrinti, kol jame yra augintinių.
- Augintinio negalima ištrinti, kol jis turi priežiūros įrašų.
- Priežiūros įrašo autorius nustatomas pagal prisijungusį naudotoją.
- SQL užklausose naudotojo pateikiamoms reikšmėms naudojami parametrai.

## 2 laboratorinis darbas – autentifikacija ir autorizacija

Realizuota registracija, prisijungimas, prisijungusio naudotojo
informacijos gavimas, žetonų atnaujinimas ir atsijungimas.

| Metodas | Paskirtis |
|---|---|
| POST /auth/register | Darbuotojo paskyros registracija. |
| POST /auth/login | Prisijungimas ir žetonų gavimas. |
| GET /auth/me | Prisijungusio naudotojo informacija. |
| POST /auth/refresh | Prieigos ir atnaujinimo žetonų atnaujinimas. |
| POST /auth/logout | Dabartinės sesijos atšaukimas. |
| GET /users | Naudotojų sąrašas administratoriui. |
| PATCH /users/{id} | Kito naudotojo rolės arba aktyvumo keitimas. |

### Sesijų valdymas

- Slaptažodžiai saugomi kaip Argon2id maišos.
- Prieigos JWT turi naudotojo ID, rolę, sesijos ID ir galiojimo laiką.
- Tikrinamas JWT parašas, algoritmas, išdavėjas, gavėjas ir galiojimas.
- Atnaujinimo žetonas generuojamas atsitiktinai, o bazėje saugoma jo SHA-256 maiša.
- Atnaujinimo žetonas pakeičiamas kiekvieno sėkmingo atnaujinimo metu.
- Atsijungus sesija pažymima kaip atšaukta.
- Apsaugotose užklausose tikrinamas sesijos ir naudotojo aktyvumas.
- Administratoriui pakeitus naudotojo rolę ar aktyvumą, jo sesijos atšaukiamos.
- Prieigos teisės tikrinamos backend dalyje.

## 3 laboratorinis darbas – naudotojo sąsaja

Sukurta Vue naudotojo sąsaja, naudojanti REST API.

### Realizuoti langai ir funkcijos

- Registracija ir prisijungimas.
- Terariumų sąrašas su paieška ir puslapiavimu.
- Terariumo informacija ir jam priklausantys augintiniai.
- Terariumų kūrimas, redagavimas ir šalinimas.
- Paskutinio valymo datos atnaujinimas.
- Augintinių sąrašas su rūšies filtru ir puslapiavimu.
- Augintinių kūrimas, redagavimas ir šalinimas.
- Augintinio profilis ir priežiūros istorija.
- Priežiūros įrašų kūrimas, redagavimas ir šalinimas.
- Bendras priežiūros įrašų sąrašas su filtrais ir puslapiavimu.
- Atskiro priežiūros įrašo peržiūra modaliniame lange.
- Naudotojų administravimas pagal administratoriaus teises.
- Sesijos atkūrimas po puslapio atnaujinimo ir automatinis žetonų atnaujinimas.

Veiksmų mygtukai rodomi pagal naudotojo teises.
Backend papildomai tikrina kiekvieno apsaugoto veiksmo teisėtumą.

### UI reikalavimų įgyvendinimas

| Reikalavimas | Įgyvendinimas |
|---|---|
| Sąsajos projektas | [Wireframe projektas](docs/wireframes/TerraCare-wireframes.drawio): 16 puslapių: prisijungimas, registracija, sąrašai, detalūs vaizdai, administravimas, mobilus išdėstymas ir modaliniai langai. |
| Trijų objektų CRUD | Terariumų, augintinių ir priežiūros įrašų valdymas. |
| Prisitaikantis išdėstymas | CSS Grid, Flexbox ir medijos užklausos, įskaitant 768 px lūžio tašką. |
| Prisitaikantis meniu | Platiame ekrane horizontalus meniu, siaurame – išskleidžiamas hamburgerio meniu. |
| Prisitaikantys paveikslėliai | Nuotraukai naudojamos `max-width: 100%` ir `height: auto` taisyklės. |
| Header, Content ir Footer | Atskiros sritys su skirtingais stiliais, nuorodomis, tekstu ir kitais elementais. |
| Įvedimo elementai | Teksto, el. pašto, slaptažodžio, skaičiaus ir datos laukai, `textarea`, `select` ir aktyvumo žymimasis laukelis. |
| Animacijos ir transitions | Kortelių ir mygtukų efektai; atsižvelgiama į `prefers-reduced-motion`. |
| Vektorinės ikonos | SVG ikonos logotipe, navigacijoje ir mobiliajame meniu. |
| Nestandartinis šriftas | „Manrope“ šriftas iš Google Fonts. |
| Modaliniai langai | Kūrimo, redagavimo, šalinimo patvirtinimo ir informacijos peržiūros langai. |
| Grįžtamasis ryšys | Sėkmės, klaidų ir krovimo pranešimai sąsajoje; nenaudojami naršyklės `alert` langai. |
| Vientisas dizainas | Bendra žalių atspalvių paletė, vienodi formų ir mygtukų stiliai. |
| Publikavimas | Frontend ir backend pasiekiami Render platformoje. |

### Nuotrauka

Terariumų puslapyje naudojama projekto autorės fotografuota rupūžės nuotrauka:

```text
frontend/public/images/toad.jpg
```

## Paleidimas vietinėje aplinkoje

### Reikalinga programinė įranga

- Node.js 24, atitinkantis projekto `package.json` nurodytas versijos ribas.
- npm.
- PostgreSQL.
- pgAdmin arba kitas PostgreSQL klientas.
- Postman API testams.

### Duomenų bazė

Naujai PostgreSQL duomenų bazei failus vykdyti tokia tvarka:

1. Sukurti duomenų bazę `terracare`.
2. Vykdyti [schema.sql](backend/database/schema.sql) – pagrindinės objektų lentelės.
3. Vykdyti [auth.sql](backend/database/auth.sql) – naudotojų ir sesijų lentelės bei `care_records.created_by` laukas.
4. Vykdyti [seed.sql](backend/database/seed.sql) – demonstraciniai duomenys.

Jau paruoštoje bazėje `schema.sql` ir `auth.sql` pakartotinai nevykdomi.
Jei bazė paruošta tik pagal LAB1 schemą, autentifikacijai vieną kartą vykdomas `auth.sql`.

Pradinių duomenų failas naujoje bazėje sukuria 5 terariumus, 6 augintinius
ir 8 priežiūros įrašus. Jis nesukuria naudotojų. Demonstracinių priežiūros
įrašų `created_by` yra `NULL`, todėl juos redaguoti ir šalinti gali vadovas
arba administratorius, o darbuotojas – tik savo sukurtus įrašus.

### Backend

Projekto pagrindiniame aplanke:

```powershell
cd backend
npm.cmd ci
```

Jei `.env` dar nėra:

```powershell
Copy-Item .env.example .env
```

Užpildyti `.env` savo aplinkos nustatymais. Jau sukonfigūruoto failo
perrašyti nereikia.

Naudojami aplinkos kintamieji:

| Kintamasis | Paskirtis |
|---|---|
| PORT | API prievadas, vietinėje aplinkoje – 3000. |
| PGHOST | Vietinio PostgreSQL serverio adresas. |
| PGPORT | PostgreSQL prievadas. |
| PGDATABASE | Duomenų bazės pavadinimas. |
| PGUSER | Duomenų bazės naudotojas. |
| PGPASSWORD | Duomenų bazės slaptažodis. |
| DATABASE_URL | Duomenų bazės ryšio URL, naudojamas, jei nustatytas. |
| JWT_SECRET | Ilga atsitiktinė JWT pasirašymo paslaptis; kodas reikalauja bent 64 simbolių. |
| JWT_ACCESS_TTL | Prieigos žetono galiojimo trukmė, pvz., `15m`. |
| REFRESH_TOKEN_DAYS | Atnaujinimo sesijos trukmė dienomis, nuo 1 iki 30. |
| CORS_ORIGINS | Leidžiami frontend origin adresai, atskirti kableliais. |
| NODE_ENV | Vykdymo aplinka. |

`.env.example` pateiktą `JWT_SECRET` vietaženklį būtina pakeisti tikra atsitiktine paslaptimi.
Ją galima sugeneruoti backend kataloge PowerShell komanda:

```powershell
@'
console.log(require("node:crypto").randomBytes(32).toString("hex"));
'@ | node
```

Gautą reikšmę įrašyti tik į privatų `.env` arba Render aplinkos nustatymus.
`CORS_ORIGINS` vietinei tiesioginei naršyklės prieigai gali būti
`http://localhost:5173`, o `NODE_ENV` – `development`.

Tikri slaptažodžiai, žetonai ir `.env` failai į Git saugyklą nekeliami.

Paleisti API:

```powershell
npm.cmd start
```

Vietiniai adresai:

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs
- Būsena: http://localhost:3000/health

### Pirmosios administratoriaus ir vadovo paskyros

Šie veiksmai skirti savo naujos duomenų bazės pradiniam paruošimui.
Veikiančioje sistemoje kitų naudotojų teisės valdomos administratoriaus sąsajoje.

1. Paleisti backend ir per `POST /auth/register` užregistruoti dvi paskyras,
   pateikiant `name`, `email` ir savo pasirinktą `password` (15–128 simbolių).
   `role` lauko registruojantis nesiųsti. Galima naudoti ir frontend registracijos formą,
   įsitikinus, kad ji jungiasi prie ruošiamos bazės API.
2. Savo duomenų bazėje per pgAdmin suteikti šioms paskyroms roles.
   Toliau pateiktus el. paštus pakeisti tiksliais ką tik užregistruotų paskyrų adresais:

```sql
BEGIN;

UPDATE users
SET role = 'admin'
WHERE LOWER(email) = 'admin@example.com'
RETURNING id, email, role;

UPDATE users
SET role = 'manager'
WHERE LOWER(email) = 'manager@example.com'
RETURNING id, email, role;

UPDATE auth_sessions
SET revoked_at = CURRENT_TIMESTAMP
WHERE user_id IN (
    SELECT id FROM users
    WHERE LOWER(email) IN ('admin@example.com', 'manager@example.com')
)
AND revoked_at IS NULL;

COMMIT;
```

Abu `UPDATE users` turi grąžinti po vieną paskyrą. Jei paskyra nerasta,
patikrinti registracijos rezultatą, el. paštą ir pasirinktą duomenų bazę.
Po rolių pakeitimo prisijungti iš naujo. Slaptažodžius saugoti privačiai,
į README ar saugyklą jų neįrašyti.

### Frontend

Kitame terminale, projekto pagrindiniame aplanke:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Atidaryti Vite terminale parodytą adresą, įprastai:

```text
http://localhost:5173
```

Frontend API adresas nustatomas per `VITE_API_BASE_URL`.
Jei kintamasis nenustatytas, naudojamas `/api` kelias.

Vietinėje Vite aplinkoje `/api` užklausas persiunčia `vite.config.js`
nustatytas proxy. Saugykloje jo `target` nustatytas į Render API. Norint viską vykdyti vietoje,
pakeisti `target` į `http://localhost:3000` ir perkrauti Vite. Galimos reikšmės:

- `http://localhost:3000` – vietinis API;
- `https://terracare-api.onrender.com` – Render API.

Proxy pašalina `/api` prefiksą prieš perduodamas užklausą backend.

Vietinis frontend gali naudoti Render API, todėl vien frontend adresas
`localhost` nereiškia, kad duomenys saugomi vietinėje bazėje.

Produkciniam frontend paketui naudojama:

```text
VITE_API_BASE_URL=https://terracare-api.onrender.com
```

`VITE_` kintamieji yra vieši frontend nustatymai – juose negalima saugoti paslapčių.
Pakeitus produkcinį API adresą būtina iš naujo sukurti frontend paketą.

### Frontend patikrinimas ir surinkimas

```powershell
npx.cmd eslint . --no-cache
npm.cmd run build
```

Produkciniai failai sukuriami `frontend/dist/` aplanke.

## Publikavimas Render platformoje

### Backend – Web Service

- Projekto katalogas: `backend`.
- Build komanda: `npm ci --omit=dev`.
- Paleidimo komanda: `npm start`.
- Duomenų bazės ir autentifikacijos paslaptys nustatomos Render aplinkoje.
- `CORS_ORIGINS` turi leisti paskelbto frontend origin:
  `https://terracare-bf2v.onrender.com`.

### Frontend – Static Site

- Projekto katalogas: `frontend`.
- Build komanda: `npm ci && npm run build`.
- Publikuojamas katalogas: `dist`.
- `VITE_API_BASE_URL`: `https://terracare-api.onrender.com`.

Vue Router navigacijai nustatyta perrašymo taisyklė:

| Source | Destination | Action |
|---|---|---|
| /* | /index.html | Rewrite |

Ji leidžia tiesiogiai atidaryti vidinius puslapius ir juos atnaujinti su F5.

## Testavimas

### Postman

Aktuali kolekcija – **„TerraCare LAB1 + LAB2“**.

- [Kolekcijos failas](backend/postman/TerraCare-LAB1-LAB2.postman_collection.json).
- [Vietinės aplinkos pavyzdys](backend/postman/terracare.local.example.json).

Importuoti abu failus į Postman ir privačiai užpildyti paskyrų duomenis.

Pradinė LAB1 kolekcija turėjo 29 užklausas. Bendra kolekcija papildyta
autentifikacijos, rolių, įrašų nuosavybės ir sesijų tikrinimo scenarijais.
Dabartinei apsaugotai API testuoti naudojama bendra kolekcija.

Prieš paleidimą nustatyti privačius Postman aplinkos kintamuosius:

| Kintamasis | Reikšmė |
|---|---|
| baseUrl | `http://localhost:3000` arba Render API adresas. |
| adminEmail | Aktyvios administratoriaus paskyros el. paštas. |
| adminPassword | Tos aplinkos administratoriaus slaptažodis. |
| managerEmail | Aktyvios vadovo paskyros el. paštas. |
| managerPassword | Tos aplinkos vadovo slaptažodis. |

Vietinės ir Render paskyros priklauso atskiroms duomenų bazėms;
jų prisijungimo duomenys gali skirtis.

Paleidimo eiga:

1. Įsitikinti, kad pasirinktas API ir jo duomenų bazė veikia.
2. Pasirinkti tinkamą Postman aplinką.
3. Atidaryti kolekcijos Runner.
4. Nustatyti vieną iteraciją.
5. Vykdyti visą kolekciją nuo pradžios nustatyta tvarka.
6. Patikrinti, kad nėra nepraėjusių testų.

Testai kuria bandomuosius duomenis. Sėkmingos eigos pabaigoje jie
sutvarkomi kolekcijos užklausomis. Nutraukus ar nesėkmingai užbaigus
vykdymą gali likti testinių duomenų.

Dažnai kartojant kolekciją galima pasiekti autentifikacijos užklausų
limitą ir gauti `429`. Testavimo kolekcija skirta demonstracinei aplinkai.

### Atlikti patikrinimai

- Po paskutinių backend pataisymų vietinėje aplinkoje Postman kolekcija
  baigėsi be nepraėjusių testų.
- Ankstesnė kolekcijos versija sėkmingai patikrinta ir Render aplinkoje.
- Vietinėje aplinkoje patikrintas prisijungimo bandymų ribojimas.
- Frontend ESLint patikrinimas ir produkcinis surinkimas baigėsi sėkmingai.
- Po publikavimo patikrintas prisijungimas, terariumo puslapio atnaujinimas
  su F5, augintinio profilio ir priežiūros įrašų peržiūra bei atsijungimas.
- Patikrintas sąsajos išdėstymas plačiame ir siaurame ekrane.

## Saugumo priemonės ir ribotumai

Įgyvendintos priemonės:

- Argon2id slaptažodžių maišos.
- JWT ir duomenų bazėje saugomų sesijų tikrinimas.
- Atnaujinimo žetonų rotacija.
- Rolių ir priežiūros įrašų nuosavybės kontrolė backend dalyje.
- Parametrizuotos SQL užklausos.
- Įvesties validavimas.
- Autentifikacijos atsakymų `Cache-Control: no-store`.
- Registracijos, prisijungimo ir žetonų atnaujinimo užklausų ribojimas.
- Leidžiamų frontend origin adresų CORS konfigūracija.
- HTTPS paskelbtai sistemai.

Per 15 minučių vienam IP nustatyti limitai:

- Registracija – 10 užklausų.
- Prisijungimas – 30 užklausų.
- Žetonų atnaujinimas – 120 užklausų.

Ribotumai:

- Bandymų skaitikliai laikomi serverio atmintyje ir persikrovus išvalomi.
  Kelioms backend instancijoms reikėtų bendros skaitiklių saugyklos.
- Už proxy veikiančio serverio IP nustatymus būtina derinti su talpinimo
  infrastruktūra; vietinis ribojimo testas nepatvirtina šios konfigūracijos.
- Frontend žetonai saugomi `sessionStorage`, todėl juos gali pasiekti
  tame pačiame origin vykdomas JavaScript. XSS apsauga išlieka svarbi.
- CORS yra naršyklės prieigos politika, o ne autentifikacijos pakaitalas.
- Paskutiniai `npm audit --omit=dev` patikrinimai backend ir frontend
  aplinkose nerodė žinomų produkcinių priklausomybių pažeidžiamumų.
  Pilnuose audituose liko kūrimo ir testavimo priklausomybių įspėjimų.
- Automatiniai testai ir atlikta pasirinktų kodo dalių peržiūra nėra
  išsamus saugumo auditas ir negarantuoja pažeidžiamumų nebuvimo.

## HTTP atsakymų kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Sėkmingas gavimas, prisijungimas arba atnaujinimas. |
| 201 | Objektas arba paskyra sukurta. |
| 204 | Objektas ištrintas arba sėkmingai atsijungta; atsakymas be turinio. |
| 400 | Netinkamas ID, užklausos parametras arba netaisyklingas JSON. |
| 401 | Reikia prisijungti arba žetonas / sesija nebegalioja. |
| 403 | Nepakanka teisių veiksmui atlikti. |
| 404 | Objektas nerastas. |
| 409 | Konfliktas, pvz., susiję įrašai neleidžia ištrinti objekto arba el. paštas jau naudojamas. |
| 422 | Netinkami pateikti duomenys. |
| 429 | Viršytas užklausų limitas. |
| 500 | Vidinė serverio klaida. |
| 503 | Būsenos tikrinimo metu nepasiekiama duomenų bazė. |
