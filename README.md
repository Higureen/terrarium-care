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
