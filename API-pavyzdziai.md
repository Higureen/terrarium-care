# TerraCare API metodai ir naudojimo pavyzdžiai

Pavyzdžiai parengti pagal pateiktą OpenAPI specifikaciją. Tai iliustraciniai duomenys, ne užklausų vykdymo rezultatai. Pakeiskite ID, prisijungimo duomenis ir žetonus savo aplinkos reikšmėmis. Klaidos tekstas priklauso nuo konkretaus atvejo.

API: https://terracare-api.onrender.com

Vietinė API: http://localhost:3000

OpenAPI failas: [api-spec.yaml](api-spec.yaml)

Apsaugoti metodai reikalauja `Authorization: Bearer <prieigos_žetonas>`. Registracija suteikia `worker` rolę. Atsijungimas panaikina sesiją.

## 1. GET /pets/{id}/profile

Gauti augintinio profilį

Viename atsakyme sujungiama augintinio informacija, jo terariumas ir priežiūros istorija. Jei priežiūros įrašų nėra, care_records yra tuščias masyvas. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /pets/1/profile HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Augintinio profilis iš trijų susijusių esybių |
| 400 | Netinkamas augintinio ID |
| 404 | Augintinis nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "pet": {
    "id": 1,
    "terrarium_id": 1,
    "name": "Pupa",
    "species": "Litoria caerulea",
    "arrival_date": "2026-09-01",
    "notes": "Aktyvi vakare."
  },
  "terrarium": {
    "id": 1,
    "name": "Demo naudotojas",
    "temperature_min": 22,
    "temperature_max": 26,
    "humidity_min": 60,
    "humidity_max": 80,
    "last_cleaned": "2026-11-01",
    "notes": "Demonstracinės pastabos."
  },
  "care_records": [
    {
      "id": 1,
      "pet_id": 1,
      "care_type": "feeding",
      "performed_at": "2026-11-01T10:00:00.000Z",
      "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
      "created_by": 1
    }
  ]
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas augintinio ID."
}
```

## 2. GET /terrariums/{terrariumId}/pets/{petId}/care-records

Gauti terariumo augintinio priežiūros įrašus

Tikrinama, ar terariumas egzistuoja ir ar augintinis priklauso būtent jam. Grąžinama augintinio priežiūros istorija nuo naujausių įrašų. Jei istorija tuščia, grąžinamas tuščias masyvas. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /terrariums/1/pets/1/care-records HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Augintinio priežiūros įrašų sąrašas |
| 400 | Netinkamas terariumo arba augintinio ID |
| 404 | Terariumas nerastas arba augintinis šiame terariume nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
[
  {
    "id": 1,
    "pet_id": 1,
    "care_type": "feeding",
    "performed_at": "2026-11-01T10:00:00.000Z",
    "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
    "created_by": 1
  }
]
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Terariumo ir augintinio ID turi būti teigiami sveikieji skaičiai."
}
```

## 3. GET /terrariums/{id}

Gauti terariumą pagal ID

Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /terrariums/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Terariumo informacija |
| 400 | Netinkamas terariumo ID |
| 404 | Terariumas nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "name": "Varlių terariumas",
  "temperature_min": "22.00",
  "temperature_max": "26.00",
  "humidity_min": "60.00",
  "humidity_max": "80.00",
  "last_cleaned": "2026-11-01",
  "notes": "Demonstracinis terariumas."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkami užklausos duomenys."
}
```

## 4. PUT /terrariums/{id}

Atnaujinti terariumą

Pakeičia terariumo informaciją. Reikia pateikti pavadinimą ir visas temperatūros bei drėgmės ribas. Nepateikus last_cleaned ar notes, jie nustatomi į null. Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
PUT /terrariums/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "name": "Demo terariumas",
  "temperature_min": 22,
  "temperature_max": 26,
  "humidity_min": 60,
  "humidity_max": 80,
  "last_cleaned": "2026-10-03",
  "notes": "Demonstracinis terariumas."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Terariumas atnaujintas |
| 400 | Netinkamas ID arba netaisyklingas JSON |
| 404 | Terariumas nerastas |
| 422 | Netinkami duomenys: trūksta laukų, netinkami jų tipai, ribos arba data |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "name": "Demo terariumas",
  "temperature_min": "22.0",
  "temperature_max": "26.0",
  "humidity_min": "60.0",
  "humidity_max": "80.0",
  "last_cleaned": "2026-10-03",
  "notes": "Demonstracinis terariumas."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkami užklausos duomenys."
}
```

## 5. DELETE /terrariums/{id}

Ištrinti terariumą

Galima ištrinti tik terariumą, kuriame nėra augintinių. Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
DELETE /terrariums/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 204 | Terariumas ištrintas. Atsakymo turinio nėra. |
| 400 | Netinkamas terariumo ID |
| 404 | Terariumas nerastas |
| 409 | Terariume yra augintinių |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 204

Atsakymo turinys tuščias.

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkami užklausos duomenys."
}
```

## 6. GET /terrariums/{id}/pets

Gauti konkretaus terariumo augintinius

Hierarchinis metodas. Jei terariumas egzistuoja, bet neturi augintinių, grąžinamas tuščias masyvas. Jei terariumo nėra, grąžinamas 404. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /terrariums/1/pets HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Pasirinkto terariumo augintinių sąrašas |
| 400 | Netinkamas terariumo ID |
| 404 | Terariumas nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
[
  {
    "id": 1,
    "terrarium_id": 1,
    "name": "Pupa",
    "species": "Litoria caerulea",
    "arrival_date": "2026-09-01",
    "notes": "Aktyvi vakare."
  }
]
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkami užklausos duomenys."
}
```

## 7. GET /terrariums

Gauti terariumų sąrašą

Grąžina vieną sąrašo puslapį. Galima ieškoti pagal pavadinimo dalį, neatsižvelgiant į raidžių dydį. Nesant rezultatų, data yra tuščias masyvas. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /terrariums?page=1&limit=5 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Terariumų sąrašo puslapis su navigacijos nuorodomis |
| 400 | Netinkami puslapiavimo arba filtravimo parametrai |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "data": [
    {
      "id": 1,
      "name": "Varlių terariumas",
      "temperature_min": "22.00",
      "temperature_max": "26.00",
      "humidity_min": "60.00",
      "humidity_max": "80.00",
      "last_cleaned": "2026-11-01",
      "notes": "Demonstracinis terariumas.",
      "_links": {
        "self": "/terrariums/1",
        "pets": "/terrariums/1/pets"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  },
  "_links": {
    "self": "/terrariums?page=1&limit=5",
    "first": "/terrariums?page=1&limit=5",
    "previous": null,
    "next": null
  }
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "page ir limit turi būti teigiami sveikieji skaičiai."
}
```

## 8. POST /terrariums

Sukurti terariumą

Temperatūros ir drėgmės minimumai negali viršyti maksimumų. Nepateikus datos ar pastabų, jos nustatomos į null. Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
POST /terrariums HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "name": "Demo terariumas",
  "temperature_min": 22,
  "temperature_max": 26,
  "humidity_min": 60,
  "humidity_max": 80,
  "last_cleaned": "2026-10-03",
  "notes": "Demonstracinis terariumas."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 201 | Terariumas sukurtas |
| 400 | Netaisyklingas JSON formatas |
| 422 | Netinkami duomenys: trūksta laukų, netinkami jų tipai, ribos arba data |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 201

```json
{
  "id": 1,
  "name": "Demo terariumas",
  "temperature_min": "22.0",
  "temperature_max": "26.0",
  "humidity_min": "60.0",
  "humidity_max": "80.0",
  "last_cleaned": "2026-10-03",
  "notes": "Demonstracinis terariumas."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netaisyklingas JSON formatas."
}
```

## 9. GET /care-records/{id}

Gauti priežiūros įrašą pagal ID

Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /care-records/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Priežiūros įrašo informacija |
| 400 | Netinkamas priežiūros įrašo ID |
| 404 | Priežiūros įrašas nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "pet_id": 1,
  "care_type": "feeding",
  "performed_at": "2026-11-01T10:00:00.000Z",
  "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
  "created_by": 1
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas priežiūros įrašo ID."
}
```

## 10. PUT /care-records/{id}

Atnaujinti priežiūros įrašą

Būtina pateikti pet_id, care_type ir notes. Įrašo laikas nekeičiamas. worker gali keisti arba šalinti tik savo įrašus (created_by sutampa su naudotojo ID). manager ir admin gali tvarkyti visus įrašus. Autorius redaguojant nekeičiamas. Prieiga: worker – tik savo įrašai; manager ir admin – visi įrašai.

### Užklausos pavyzdys

```http
PUT /care-records/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "pet_id": 1,
  "care_type": "observation",
  "notes": "Augintinis aktyvus, pakitimų nepastebėta."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Priežiūros įrašas atnaujintas |
| 400 | Netinkamas ID arba netaisyklingas JSON |
| 404 | Priežiūros įrašas nerastas |
| 422 | Netinkami duomenys arba augintinis neegzistuoja |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "pet_id": 1,
  "care_type": "observation",
  "performed_at": "2026-11-01T10:00:00.000Z",
  "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
  "created_by": 1
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas priežiūros įrašo ID."
}
```

## 11. DELETE /care-records/{id}

Ištrinti priežiūros įrašą

worker gali keisti arba šalinti tik savo įrašus (created_by sutampa su naudotojo ID). manager ir admin gali tvarkyti visus įrašus. Autorius redaguojant nekeičiamas. Prieiga: worker – tik savo įrašai; manager ir admin – visi įrašai.

### Užklausos pavyzdys

```http
DELETE /care-records/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 204 | Priežiūros įrašas ištrintas. Atsakymo turinio nėra. |
| 400 | Netinkamas priežiūros įrašo ID |
| 404 | Priežiūros įrašas nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 204

Atsakymo turinys tuščias.

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas priežiūros įrašo ID."
}
```

## 12. GET /care-records

Gauti priežiūros įrašų sąrašą

Grąžina vieną sąrašo puslapį nuo naujausių įrašų. Galima filtruoti pagal priežiūros tipą ir augintinį. Abu filtrai gali būti naudojami kartu. Nesant rezultatų, data yra tuščias masyvas. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /care-records?page=1&limit=5 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Priežiūros įrašų sąrašo puslapis su navigacijos nuorodomis |
| 400 | Netinkami puslapiavimo arba filtravimo parametrai |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "data": [
    {
      "id": 1,
      "pet_id": 1,
      "care_type": "feeding",
      "performed_at": "2026-11-01T10:00:00.000Z",
      "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
      "created_by": 1,
      "_links": {
        "self": "/care-records/1",
        "pet": "/pets/1",
        "profile": "/pets/1/profile"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  },
  "_links": {
    "self": "/care-records?page=1&limit=5",
    "first": "/care-records?page=1&limit=5",
    "previous": null,
    "next": null
  }
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Priežiūros tipas turi būti feeding, observation arba other."
}
```

## 13. POST /care-records

Sukurti priežiūros įrašą

Įrašas priskiriamas egzistuojančiam augintiniui. Laikas nustatomas automatiškai. Prieinama prisijungusiems naudotojams. created_by nustato serveris pagal prisijungusį naudotoją, jo siųsti nereikia. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
POST /care-records HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "pet_id": 1,
  "care_type": "observation",
  "notes": "Augintinis aktyvus, pakitimų nepastebėta."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 201 | Priežiūros įrašas sukurtas |
| 400 | Netaisyklingas JSON formatas |
| 422 | Netinkami duomenys arba augintinis neegzistuoja |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 201

```json
{
  "id": 1,
  "pet_id": 1,
  "care_type": "observation",
  "performed_at": "2026-11-01T10:00:00.000Z",
  "notes": "Augintinis aktyvus, pakitimų nepastebėta.",
  "created_by": 1
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netaisyklingas JSON formatas."
}
```

## 14. PUT /pets/{id}

Atnaujinti augintinį

Pakeičia augintinio kortelę. Nepateikus notes, šis laukas nustatomas į null. Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
PUT /pets/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "terrarium_id": 1,
  "name": "Mėta",
  "species": "Litoria caerulea",
  "arrival_date": "2026-10-03",
  "notes": "Aktyvi vakare."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Augintinis atnaujintas |
| 400 | Netinkamas ID arba netaisyklingas JSON |
| 404 | Augintinis nerastas |
| 422 | Netinkami duomenys arba nurodytas terariumas neegzistuoja |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "terrarium_id": 1,
  "name": "Mėta",
  "species": "Litoria caerulea",
  "arrival_date": "2026-10-03",
  "notes": "Aktyvi vakare."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas augintinio ID."
}
```

## 15. DELETE /pets/{id}

Ištrinti augintinį

Augintinį galima ištrinti tik tada, kai jis neturi priežiūros įrašų. Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
DELETE /pets/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 204 | Augintinis ištrintas. Atsakymo turinio nėra. |
| 400 | Netinkamas augintinio ID |
| 404 | Augintinis nerastas |
| 409 | Augintinis turi priežiūros įrašų |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 204

Atsakymo turinys tuščias.

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkamas augintinio ID."
}
```

## 16. GET /pets/{id}

Gauti augintinį pagal ID

Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /pets/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Augintinio informacija |
| 400 | Netinkamas augintinio ID |
| 404 | Augintinis nerastas |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "terrarium_id": 1,
  "name": "Pupa",
  "species": "Litoria caerulea",
  "arrival_date": "2026-09-01",
  "notes": "Aktyvi vakare."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Augintinio ID turi būti teigiamas sveikasis skaičius."
}
```

## 17. POST /pets

Sukurti augintinį

Prieinama tik manager ir admin rolėms. Prieiga: Tik manager ir admin.

### Užklausos pavyzdys

```http
POST /pets HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "terrarium_id": 1,
  "name": "Mėta",
  "species": "Litoria caerulea",
  "arrival_date": "2026-10-03",
  "notes": "Aktyvi vakare."
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 201 | Augintinis sukurtas |
| 400 | Netaisyklingas JSON formatas |
| 422 | Netinkami duomenys arba nurodytas terariumas neegzistuoja |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 403 | Nepakanka teisių atlikti veiksmą. |

### Atsakymo pavyzdys

HTTP 201

```json
{
  "id": 1,
  "terrarium_id": 1,
  "name": "Mėta",
  "species": "Litoria caerulea",
  "arrival_date": "2026-10-03",
  "notes": "Aktyvi vakare."
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "Netinkami užklausos duomenys."
}
```

## 18. GET /pets

Gauti augintinių sąrašą

Grąžina vieną sąrašo puslapį. Galima filtruoti pagal tikslų rūšies pavadinimą, neatsižvelgiant į raidžių dydį. Nesant rezultatų, data yra tuščias masyvas. Prieinama prisijungusiems worker, manager ir admin. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /pets?page=1&limit=5 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Augintinių sąrašo puslapis su navigacijos nuorodomis |
| 400 | Netinkami puslapiavimo arba filtravimo parametrai |
| 500 | Serverio klaida |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "data": [
    {
      "id": 1,
      "terrarium_id": 1,
      "name": "Pupa",
      "species": "Litoria caerulea",
      "arrival_date": "2026-09-01",
      "notes": "Aktyvi vakare.",
      "_links": {
        "self": "/pets/1",
        "profile": "/pets/1/profile",
        "terrarium": "/terrariums/1",
        "care_records": "/terrariums/1/pets/1/care-records"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  },
  "_links": {
    "self": "/pets?page=1&limit=5",
    "first": "/pets?page=1&limit=5",
    "previous": null,
    "next": null
  }
}
```

### Klaidos pavyzdys

HTTP 400

```json
{
  "error": "page ir limit turi būti teigiami sveikieji skaičiai."
}
```

## 19. POST /auth/register

Užregistruoti darbuotoją

 Prieiga: Vieša prieiga.

### Užklausos pavyzdys

```http
POST /auth/register HTTP/1.1
Host: terracare-api.onrender.com
Content-Type: application/json

{
  "name": "Demo naudotojas",
  "email": "demo@example.com",
  "password": "Pavyzdinis-Slaptazodis-2026"
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 201 | Paskyra sukurta; žetonai neišduodami. |
| 409 | El. pašto adresas jau naudojamas. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 400 | Netaisyklingas JSON formatas arba netinkamas ID. |
| 422 | Netinkami užklausos duomenys. |
| 429 | Viršytas užklausų dažnio limitas. |

### Atsakymo pavyzdys

HTTP 201

```json
{
  "id": 1,
  "name": "Demo naudotojas",
  "email": "demo@example.com",
  "role": "worker",
  "created_at": "2026-11-01T10:00:00.000Z"
}
```

### Klaidos pavyzdys

HTTP 409

```json
{
  "error": "Veiksmas negalimas dėl susijusių arba pasikartojančių duomenų."
}
```

## 20. POST /auth/login

Prisijungti

 Prieiga: Vieša prieiga.

### Užklausos pavyzdys

```http
POST /auth/login HTTP/1.1
Host: terracare-api.onrender.com
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "Pavyzdinis-Slaptazodis-2026"
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Išduota žetonų pora. |
| 401 | Neteisingi prisijungimo duomenys arba neaktyvi paskyra. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 400 | Netaisyklingas JSON formatas arba netinkamas ID. |
| 422 | Netinkami užklausos duomenys. |
| 429 | Viršytas užklausų dažnio limitas. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "accessToken": "PAKEISKITE_GAUTU_JWT",
  "refreshToken": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "name": "Demo naudotojas",
    "email": "demo@example.com",
    "role": "worker"
  }
}
```

### Klaidos pavyzdys

HTTP 401

```json
{
  "error": "Reikalingas galiojantis prisijungimo žetonas."
}
```

## 21. POST /auth/refresh

Atnaujinti žetonus

Access žetonas nereikalingas. Senasis refreshToken pakeičiamas ir nebeveikia. Pradinė sesijos galiojimo pabaiga nepratęsiama. Ankstesnis accessToken gali veikti iki galiojimo pabaigos, kol sesija aktyvi. Prieiga: Vieša prieiga.

### Užklausos pavyzdys

```http
POST /auth/refresh HTTP/1.1
Host: terracare-api.onrender.com
Content-Type: application/json

{
  "refreshToken": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Nauja žetonų pora. Išsaugokite naują refreshToken. |
| 401 | Atnaujinimo žetonas netinkamas, panaudotas arba nebegalioja. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 400 | Netaisyklingas JSON formatas arba netinkamas ID. |
| 422 | Netinkami užklausos duomenys. |
| 429 | Viršytas užklausų dažnio limitas. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "accessToken": "PAKEISKITE_GAUTU_JWT",
  "refreshToken": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "name": "Demo naudotojas",
    "email": "demo@example.com",
    "role": "worker"
  }
}
```

### Klaidos pavyzdys

HTTP 401

```json
{
  "error": "Reikalingas galiojantis prisijungimo žetonas."
}
```

## 22. GET /auth/me

Gauti prisijungusį naudotoją

 Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
GET /auth/me HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Naudotojo id, name, email ir role. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "name": "Demo naudotojas",
  "email": "demo@example.com",
  "role": "worker"
}
```

### Klaidos pavyzdys

HTTP 401

```json
{
  "error": "Reikalingas galiojantis prisijungimo žetonas."
}
```

## 23. POST /auth/logout

Atsijungti nuo dabartinės sesijos

Reikalingas galiojantis accessToken. Panaikinama tik dabartinė sesija: jos access ir refresh žetonai nebeveikia. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
POST /auth/logout HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 204 | Sesija panaikinta. Atsakymo turinio nėra. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 204

Atsakymo turinys tuščias.

### Klaidos pavyzdys

HTTP 401

```json
{
  "error": "Reikalingas galiojantis prisijungimo žetonas."
}
```

## 24. GET /users

Gauti naudotojų sąrašą

Tik admin. Prieiga: Tik admin.

### Užklausos pavyzdys

```http
GET /users HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Naudotojų sąrašas be slaptažodžių maišų ir žetonų. |
| 403 | Nepakanka teisių atlikti veiksmą. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |

### Atsakymo pavyzdys

HTTP 200

```json
[
  {
    "id": 1,
    "name": "Demo naudotojas",
    "email": "demo@example.com",
    "role": "worker",
    "is_active": true,
    "created_at": "2026-11-01T10:00:00.000Z"
  }
]
```

### Klaidos pavyzdys

HTTP 403

```json
{
  "error": "Neturite teisės atlikti šio veiksmo."
}
```

## 25. PATCH /users/{id}

Keisti rolę arba paskyros aktyvumą

Tik admin. Bent vienas iš laukų role arba is_active. Visos naudotojo sesijos panaikinamos. Pakartotinis paskyros įjungimas senų sesijų neatkuria. Prieiga: Tik admin.

### Užklausos pavyzdys

```http
PATCH /users/1 HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "role": "worker",
  "is_active": true
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Atnaujintas naudotojas. |
| 403 | Reikia admin rolės; savo paskyros keisti negalima. |
| 404 | Naudotojas nerastas. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 400 | Netaisyklingas JSON formatas arba netinkamas ID. |
| 422 | Netinkami užklausos duomenys. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "name": "Demo naudotojas",
  "email": "demo@example.com",
  "role": "worker",
  "is_active": true,
  "created_at": "2026-11-01T10:00:00.000Z"
}
```

### Klaidos pavyzdys

HTTP 403

```json
{
  "error": "Neturite teisės atlikti šio veiksmo."
}
```

## 26. PATCH /terrariums/{id}/last-cleaned

Atnaujinti paskutinio valymo datą

worker, manager ir admin. Galima keisti tik last_cleaned lauką. Prieiga: Prisijungę worker, manager ir admin.

### Užklausos pavyzdys

```http
PATCH /terrariums/1/last-cleaned HTTP/1.1
Host: terracare-api.onrender.com
Authorization: Bearer <prieigos_žetonas>
Content-Type: application/json

{
  "last_cleaned": "2026-11-01"
}
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Atnaujinta valymo data. |
| 403 | Nepakanka teisių atlikti veiksmą. |
| 404 | Terariumas nerastas. |
| 500 | Vidinė serverio arba duomenų bazės klaida. |
| 401 | Nėra galiojančio žetono: žetonas netinkamas, pasibaigęs, sesija panaikinta arba paskyra neaktyvi. |
| 400 | Netaisyklingas JSON formatas arba netinkamas ID. |
| 422 | Netinkami užklausos duomenys. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "id": 1,
  "name": "Demo naudotojas",
  "last_cleaned": "2026-11-01"
}
```

### Klaidos pavyzdys

HTTP 403

```json
{
  "error": "Neturite teisės atlikti šio veiksmo."
}
```

## 27. GET /health

Patikrinti serverio ir DB būklę

 Prieiga: Vieša prieiga.

### Užklausos pavyzdys

```http
GET /health HTTP/1.1
Host: terracare-api.onrender.com
```

### Atsako kodai

| Kodas | Reikšmė |
|---|---|
| 200 | Serveris ir DB pasiekiami. |
| 503 | Duomenų bazė nepasiekiama. |

### Atsakymo pavyzdys

HTTP 200

```json
{
  "status": "ok",
  "database": "connected"
}
```