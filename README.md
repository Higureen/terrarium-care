# Zoologijos sodo terariumų ir augintinių priežiūros sistema

## Sistemos paskirtis

Projekto tikslas – sukurti sistemą, leidžiančią zoologijos sodo darbuotojams tvarkyti informaciją apie terariumus, juose gyvenančius augintinius ir jų priežiūrą.

Kiekvienas terariumas turės individualias temperatūros ir drėgmės ribas, paskutinio valymo datą bei pastabas. Augintiniai turės vardus, rūšis ir individualias pastabas. Priežiūros įrašuose bus registruojamas maitinimas, būklės stebėjimai ar kiti priežiūros veiksmai.

## Funkciniai reikalavimai

Toliau aprašytos planuojamos visos sistemos funkcijos. Pirmajame laboratoriniame darbe realizuota API; prisijungimas, rolių tikrinimas ir Vue naudotojo sąsaja dar nerealizuoti.

### Darbuotojas
- Gali prisijungti ir atsijungti.
- Gali peržiūrėti terariumų sąrašą, jų laikymo sąlygas ir augintinius.
- Gali peržiūrėti augintinių informaciją ir priežiūros istoriją.
- Gali kurti priežiūros įrašus, redaguoti ir šalinti savo įrašus.
- Gali atnaujinti terariumo paskutinio valymo datą.

### Vadovas
- Gali atlikti visus darbuotojui leidžiamus veiksmus.
- Gali kurti, redaguoti ir šalinti terariumus.
- Gali nustatyti terariumų temperatūros ir drėgmės ribas.
- Gali kurti, redaguoti ir šalinti augintinių korteles.
- Gali priskirti augintinius terariumams.
- Gali redaguoti ir šalinti visų darbuotojų priežiūros įrašus.

### Administratorius
- Gali atlikti visus vadovui leidžiamus veiksmus.
- Gali kurti ir panaikinti naudotojų paskyras.
- Gali keisti naudotojų roles.

## Pasirinktos technologijos

- **Vue.js, JavaScript, HTML ir CSS** – grafinei naudotojo sąsajai kurti.
- **Node.js ir Express** – serverio daliai ir sistemos logikai realizuoti.
- **PostgreSQL** – sistemos duomenims saugoti.
- **Render** – planuojama debesų platforma sistemai talpinti.

## 1 laboratorinis darbas – REST API

Realizuota terariumų, augintinių ir priežiūros įrašų REST API.
Kiekvienam objektui sukurti penki metodai: kūrimas, sąrašo gavimas,
vieno objekto gavimas, atnaujinimas ir trynimas.

Papildomai realizuoti trys metodai: terariumo augintinių sąrašas, augintinio profilis ir hierarchinis priežiūros įrašų sąrašas. Iš viso yra 18 taikomosios srities API metodų.

Duomenys saugomi PostgreSQL duomenų bazėje.
Užklausų ir atsakymų turiniui naudojamas JSON.
Sėkmingai ištrynus objektą grąžinamas 204 atsakymas be turinio.

### Reikalinga programinė įranga

- Node.js ir npm (kurta naudojant Node.js 24).
- PostgreSQL (kurta naudojant PostgreSQL 18).
- pgAdmin arba kitas PostgreSQL klientas.
- Postman – automatinei demonstracijai.

### Duomenų bazės paruošimas

1. PostgreSQL serveryje sukurti duomenų bazę `terracare`.
2. Šioje duomenų bazėje vykdyti `backend/database/schema.sql`.
3. Vykdyti `backend/database/seed.sql`, kuris įkelia pradinius duomenis.

`schema.sql` skirtas naujai duomenų bazei.
Jei lentelės jau sukurtos, jo pakartotinai vykdyti nereikia.

### Serverio paleidimas

Projekto pagrindiniame aplanke atidaryti terminalą:

```powershell
cd backend
npm.cmd ci
Copy-Item .env.example .env
```

Faile `.env` nustatyti savo PostgreSQL prisijungimo duomenis.
Jei `.env` jau sukonfigūruotas, jo kopijuoti iš naujo nereikia.

Paleisti serverį:

```powershell
node server.js
```

Serveris pasiekiamas adresu http://localhost:3000.
Naudojantis API serverio terminalas turi likti veikiantis.
Serveriui sustabdyti naudojama Ctrl + C.

### API dokumentacija

- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/openapi.json
- Specifikacijos failas: `backend/openapi.json`
- Serverio ir DB ryšio patikrinimas: http://localhost:3000/health

### API metodai

| Objektas | Sąrašas | Vienas objektas | Kūrimas | Atnaujinimas | Trynimas |
|---|---|---|---|---|---|
| Terariumai | GET /terrariums | GET /terrariums/{id} | POST /terrariums | PUT /terrariums/{id} | DELETE /terrariums/{id} |
| Augintiniai | GET /pets | GET /pets/{id} | POST /pets | PUT /pets/{id} | DELETE /pets/{id} |
| Priežiūros įrašai | GET /care-records | GET /care-records/{id} | POST /care-records | PUT /care-records/{id} | DELETE /care-records/{id} |

### Papildomi API metodai

| Metodas | Paskirtis |
|---|---|
| GET /terrariums/{id}/pets | Konkretaus terariumo augintiniai. |
| GET /pets/{id}/profile | Augintinio profilis: augintinis, jo terariumas ir priežiūros įrašai. |
| GET /terrariums/{terrariumId}/pets/{petId}/care-records | Konkretaus terariumo konkretaus augintinio priežiūros įrašai. |

Hierarchija: **terariumas → augintinis → priežiūros įrašas**. Abu ryšiai yra vienas su daug. Hierarchinis metodas patikrina, ar augintinis priklauso nurodytam terariumui; jei nepriklauso, grąžina 404.

### Puslapiavimas, filtravimas ir nuorodos

Pagrindiniai sąrašų metodai priima `page` ir `limit` parametrus. Numatyta `page=1`, `limit=5`, didžiausias `limit=100`.

- `/terrariums` – filtravimas pagal `name` (pavadinimo dalį).
- `/pets` – filtravimas pagal `species`.
- `/care-records` – filtravimas pagal `care_type` ir `pet_id`.

Pavyzdys: `GET /pets?species=Litoria%20caerulea&page=1&limit=5`.

Šių metodų atsakyme `data` pateikia įrašus, `pagination` – puslapiavimo informaciją, `_links` – nuorodas į puslapius. Įrašų `_links` pateikia nuorodas į pačius resursus ir susijusius duomenis.

### Automatinė demonstracija su Postman

1. Paleisti PostgreSQL ir API serverį.
2. Į Postman importuoti `backend/postman/TerraCare API.postman_collection.json`.
3. Kolekcijos kintamąjį `baseUrl` nustatyti į `http://localhost:3000`.
4. Atidaryti kolekcijos Runner.
5. Nustatyti vieną iteraciją ir 0 ms delsą.
6. Paleisti visas 29 užklausas kolekcijoje nustatyta numeruota tvarka.

Kolekcijoje yra **29 užklausos**, kurios tikrina **18 skirtingų taikomosios srities API metodų** ir papildomus jų veikimo atvejus. Viena užklausa gali turėti kelis testus.

Tikrinama:

- Visų trijų objektų CRUD ir sąrašų gavimas.
- Filtravimas, puslapiavimas ir perėjimas į kitą puslapį.
- Augintinio profilis ir hierarchinis priežiūros įrašų gavimas.
- 404, kai augintinis nepriklauso terariumui arba terariumas ištrintas.
- 422, kai pateikta netinkama drėgmė.
- 400, kai JSON netaisyklingas arba puslapiavimo ir filtro parametrai netinkami.

Kūrimo užklausos automatiškai išsaugo sukurtų objektų ID kolekcijos kintamuosiuose. Sėkmingo paleidimo pabaigoje demonstracijos metu sukurti objektai ištrinami: pirmiausia priežiūros įrašas, tada augintinis ir terariumas.

Puslapiavimo testui duomenų bazėje turi būti bent du `Litoria caerulea` rūšies augintiniai. Pradinius duomenis paruošia `backend/database/seed.sql`.

Runner lange patikrinti, kad nėra nepavykusių testų ir demonstracijos trukmė neviršija maždaug 15 sekundžių. Trukmė priklauso nuo aplinkos.

### Atsakymų kodai

- 200 – sėkmingas gavimas arba atnaujinimas.
- 201 – objektas sukurtas.
- 204 – objektas ištrintas.
- 400 – netinkamas ID, puslapiavimo ar filtro parametras arba netaisyklingas JSON.
- 404 – objektas nerastas.
- 409 – objekto negalima ištrinti dėl susijusių įrašų.
- 422 – netinkami pateikti duomenys.
- 500 – vidinė serverio klaida.

Terariumo negalima ištrinti, kol jame yra augintinių.
Augintinio negalima ištrinti, kol jis turi priežiūros įrašų.

