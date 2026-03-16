/**
 * STORES & SERVICES DATABASE
 * Dedicated to high-priority search results for specific shops
 */

const allStores = [
    {
        id: "store-01",
        name: "ResinCosmos",
        type: "store",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjM09SpkxpgIwrMY-T2RQ3fPUCMdYJOYcOJ5CdkwwBMiy8IOYTe8StmCvriS42IMewSXpVWtxEAEVrM7eq3yChS_ptOwCwKvMlo0xRSzjZDhDqiNDRPNxGyeniNZ47bGFq-pFvK16XRvGVzx7wR5YJz8cmoaEdk6yK18hH2YDDC06Vvt1HTAsPL1Qvt8Zg/w200-h200/Resin%20cosmos.png",
        link: "setbrand/resin/resincosmos.html",
        category: "Resin Art & Supplies",
        description: "Premium resin, pigments, and crystal-clear epoxy materials.",
        // The "Brain": Handles typos and related industry terms
        keywords: "resin store, resin shop, raw material, epoxy, hardener, silicon molds, liquid glass, resin art, resn, resincosmos"
    },
    {
        id: "store-02",
        name: "Acrylic Hub",
        type: "store",
        image: "assets/acrylic-hub.jpg",
        link: "setbrand/acrylic/acrylic-hub.html",
        category: "Acrylic Fabrication",
        description: "Custom acrylic sheets, nameplates, and laser-cut displays.",
        keywords: "acrylic store, plastic sheets, plexiglass, laser cutting, acrylic box, transparent sheets, akrylic, acrylic shop"
    },
    {
        id: "store-03",
        name: "Wooden Beyond",
        type: "store",
        image: "assets/wooden-beyond.jpg",
        link: "setbrand/woodenbeyond/woodenbeyond.html",
        category: "MDF & Wood Designs",
        description: "Expert laser-cut MDF shapes, home decor, and wooden bases.",
        keywords: "mdf store, wooden shop, laser cut wood, mdf base, wood engraving, jali design, pine wood, woodon beyond, mdf material"
    }
];

// Export to window so script.js can see it
window.allStores = allStores;