const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "ITEH Uvoznici API",
    version: "1.0.0",
    description:
      "API dokumentacija za aplikaciju za upravljanje uvoznicima, dobavljačima, proizvodima, saradnjama i kontejnerima.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
    {
    url: "https://internet-tehnologije-2025-apilkacijazauvoznike2-production.up.railway.app",
    description: "Production server (Railway)",
    }
  ],
  tags: [
    { name: "Auth", description: "Autentifikacija korisnika" },
    { name: "Kategorije", description: "Rad sa kategorijama" },
    { name: "Proizvodi", description: "Rad sa proizvodima" },
    { name: "Saradnje", description: "Rad sa saradnjama" },
    { name: "Uvoznik", description: "Rute za uvoznika" },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Prijava korisnika",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "sifra"],
                properties: {
                  email: { type: "string", example: "admin@test.com" },
                  sifra: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Uspešna prijava",
          },
          "401": {
            description: "Pogrešni kredencijali",
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Odjava korisnika",
        responses: {
          "200": {
            description: "Uspešna odjava",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Vraća trenutno ulogovanog korisnika",
        responses: {
          "200": {
            description: "Podaci o korisniku",
          },
          "401": {
            description: "Korisnik nije ulogovan",
          },
        },
      },
    },

    "/api/kategorije": {
      get: {
        tags: ["Kategorije"],
        summary: "Vraća listu kategorija",
        responses: {
          "200": {
            description: "Uspešno vraćene kategorije",
          },
        },
      },
      post: {
        tags: ["Kategorije"],
        summary: "Kreira novu kategoriju",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ime"],
                properties: {
                  ime: { type: "string", example: "Elektronika" },
                  opis: { type: "string", example: "Kategorija elektronskih proizvoda" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Kategorija uspešno kreirana",
          },
          "400": {
            description: "Neispravni podaci",
          },
          "403": {
            description: "Nemate dozvolu",
          },
        },
      },
    },

    "/api/proizvodi": {
      get: {
        tags: ["Proizvodi"],
        summary: "Vraća listu proizvoda",
        responses: {
          "200": {
            description: "Uspešno vraćeni proizvodi",
          },
        },
      },
      post: {
        tags: ["Proizvodi"],
        summary: "Kreira novi proizvod",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "sifra",
                  "naziv",
                  "slika",
                  "sirina",
                  "visina",
                  "duzina",
                  "cena",
                  "idKategorija",
                  "idDobavljac",
                ],
                properties: {
                  sifra: { type: "string", example: "PROD-001" },
                  naziv: { type: "string", example: "Monitor" },
                  slika: { type: "string", example: "https://example.com/monitor.jpg" },
                  sirina: { type: "number", example: 40 },
                  visina: { type: "number", example: 30 },
                  duzina: { type: "number", example: 10 },
                  cena: { type: "number", example: 199.99 },
                  idKategorija: { type: "integer", example: 1 },
                  idDobavljac: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Proizvod uspešno kreiran",
          },
          "400": {
            description: "Neispravni podaci",
          },
        },
      },
    },

    "/api/saradnja": {
      get: {
        tags: ["Saradnje"],
        summary: "Vraća listu saradnji",
        responses: {
          "200": {
            description: "Uspešno vraćene saradnje",
          },
        },
      },
      post: {
        tags: ["Saradnje"],
        summary: "Kreira novu saradnju između uvoznika i dobavljača",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idUvoznik", "idDobavljac"],
                properties: {
                  idUvoznik: { type: "integer", example: 1 },
                  idDobavljac: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Saradnja uspešno kreirana",
          },
          "400": {
            description: "Neispravni podaci",
          },
        },
      },
    },

    "/api/uvoznik/dobavljaci": {
      get: {
        tags: ["Uvoznik"],
        summary: "Vraća dobavljače sa kojima uvoznik sarađuje",
        responses: {
          "200": {
            description: "Uspešno vraćeni dobavljači",
          },
          "401": {
            description: "Niste ulogovani",
          },
          "403": {
            description: "Nemate dozvolu",
          },
        },
      },
    },

    "/api/uvoznik/proizvodi": {
      get: {
        tags: ["Uvoznik"],
        summary: "Vraća proizvode dostupne uvozniku",
        parameters: [
          {
            name: "dobavljacId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Filter po dobavljaču",
          },
          {
            name: "kategorijaId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Filter po kategoriji",
          },
        ],
        responses: {
          "200": {
            description: "Uspešno vraćeni proizvodi",
          },
          "401": {
            description: "Niste ulogovani",
          },
          "403": {
            description: "Nemate dozvolu",
          },
        },
      },
    },

    "/api/uvoznik/proizvodi/{id}": {
      get: {
        tags: ["Uvoznik"],
        summary: "Vraća detalje jednog proizvoda dostupnog uvozniku",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID proizvoda",
          },
        ],
        responses: {
          "200": {
            description: "Uspešno vraćen proizvod",
          },
          "404": {
            description: "Proizvod nije pronađen",
          },
        },
      },
    },
  },
};

export default openApiSpec;