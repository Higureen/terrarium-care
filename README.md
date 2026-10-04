# Zoologijos sodo terariumų ir augintinių priežiūros sistema

## Sistemos paskirtis

Projekto tikslas – sukurti sistemą, leidžiančią zoologijos sodo darbuotojams tvarkyti informaciją apie terariumus, juose gyvenančius augintinius ir jų priežiūrą.

Kiekvienas terariumas turės individualias temperatūros ir drėgmės ribas, paskutinio valymo datą bei pastabas. Augintiniai turės vardus, rūšis ir individualias pastabas. Priežiūros įrašuose bus registruojamas maitinimas, būklės stebėjimai ar kiti priežiūros veiksmai.

## Funkciniai reikalavimai

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

Papildomai realizuotas hierarchinis metodas:
`GET /terrariums/{id}/pets` – konkretaus terariumo augintinių sąrašas.

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

Hierarchinis metodas: `GET /terrariums/{id}/pets`.

### Automatinė demonstracija su Postman

1. Paleisti PostgreSQL ir API serverį.
2. Į Postman importuoti `backend/postman/TerraCare API.postman_collection.json`.
3. Kolekcijos kintamąjį `baseUrl` nustatyti į `http://localhost:3000`.
4. Atidaryti kolekcijos Runner.
5. Nustatyti vieną iteraciją ir 0 ms delsą.
6. Patikrinti žemiau pateiktą užklausų eilę ir paleisti kolekciją.

Vykdymo tvarka:

1. POST /terrariums
2. GET /terrariums/{id}
3. GET /terrariums
4. PUT /terrariums/{id}
5. POST /pets
6. GET /pets/{id}
7. GET /pets
8. GET /terrariums/{id}/pets
9. PUT /pets/{id}
10. POST /care-records
11. GET /care-records/{id}
12. GET /care-records
13. PUT /care-records/{id}
14. DELETE /care-records/{id}
15. DELETE /pets/{id}
16. DELETE /terrariums/{id}
17. GET ištrinto terariumo – tikimasi 404.
18. POST terariumo su netinkama drėgme – tikimasi 422.
19. POST terariumo su netaisyklingu JSON – tikimasi 400.

Kūrimo užklausos automatiškai išsaugo sukurtų objektų ID.
Tolesnės užklausos naudoja `terrariumId`, `petId` ir `careRecordId`
kolekcijos kintamuosius. Sėkmingo paleidimo pabaigoje demonstracijos
metu sukurti objektai ištrinami.

2026-10-03 vietinio paleidimo rezultatas:
61 sėkmingas testas, 0 nepavykusių testų, trukmė – 2,412 s.
Trukmė gali skirtis priklausomai nuo aplinkos.

### Atsakymų kodai

- 200 – sėkmingas gavimas arba atnaujinimas.
- 201 – objektas sukurtas.
- 204 – objektas ištrintas.
- 400 – netinkamas ID arba netaisyklingas JSON.
- 404 – objektas nerastas.
- 409 – objekto negalima ištrinti dėl susijusių įrašų.
- 422 – netinkami pateikti duomenys.
- 500 – vidinė serverio klaida.

Terariumo negalima ištrinti, kol jame yra augintinių.
Augintinio negalima ištrinti, kol jis turi priežiūros įrašų.