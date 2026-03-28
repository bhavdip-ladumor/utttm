/**
 * STORES & SERVICES DATABASE
 * Dedicated to high-priority search results for specific shops
 */

const allStores = [
    {
        id: "Resin-cosmos-store",
        name: "ResinCosmos", 
        type: "store",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjJXGG6NW1PfEc0fLwOmucMXUMCR8pVsOWXXeggbEvDhY25acAlcuJbT4RSLulWZKta4xiUHuEXsOJag6VlzpP6rPF0FGKFhWSoQ8nLp07IRu1tIG8KvadNcocQMMZ59E6KIt5kqjK_Tgi4OHo0oLb52Dcmt-F8t09hDlGFbzUYGNOfAtgdVYTDw5DB_0w/s320/resin%20cosmos.png",
        link: "setbrand/resin/resincosmos.html",
        category: "Resin Art & Supplies",
        description: "Premium resin, pigments, and crystal-clear epoxy materials.",
        // The "Brain": Handles typos and related industry terms
        keywords: "resin store, resin shop, raw material, epoxy, hardener, silicon molds, liquid glass, resin art, resn, resincosmos"
    },
    {
        id: "Acrylic-fortune-store",
        name: "Acrylic Hub",
        type: "store",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiT7ilAyduspZXW0KPRkk9zWvwa7Ez0xydCuBevfVvIQhGjJSPixYyv7NwULBMF4tun3u994sUoGbBrOQNMAE8nKTTZPRlXRwo6AaJN70PErRLU0yJndQVBRjZCCgywNuvyGNCLbBswFaGRbSIVSo_3Gw3lIewZChTnzV_h1f7h1zUuROm-osbSRUAdxRg/s320/acrylic%20Fortune.png",
        link: "setbrand/acrylic/acrylic-hub.html",
        category: "Acrylic Fabrication",
        description: "Custom acrylic sheets, nameplates, and laser-cut displays.",
        keywords: "acrylic store, plastic sheets, plexiglass, laser cutting, acrylic box, transparent sheets, akrylic, acrylic shop"
    },
    {
        id: "Wooden-Beyond-store",
        name: "Wooden Beyond",
        type: "store",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjlL3vncNwqlJ-NX1kmka22hfdER05WtikQst0ul3wrFgsxrq8GGdYt9dVXW_BmsI35Mxr-uxONBXLHWNf8carT-y41rP2Lny4azmr0wvRsNYoorU7ISMo6-tyboxG5NZ1dPbdfcVfZqIuKJWpdUVzbx4hIfy8d3dvl9pAA24kh5D-88f6yxVXogP4U-SY/s320/Wooden%20Beyonds.png",
        link: "setbrand/woodenbeyond/woodenbeyond.html",
        category: "MDF & Wood Designs",
        description: "Expert laser-cut MDF shapes, home decor, and wooden bases.",
        keywords: "mdf store, wooden shop, laser cut wood, mdf base, wood engraving, jali design, pine wood, woodon beyond, mdf material"
    },
    {
        id: "print-matrix-solution",
        name: "Print Matrix Solution",
        type: "store",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjHMXt-QmBzxjGdVn6YNEu4HP8ZGljJgQB0LjQVT0PIlrEMdqKJbssNkVRZUa82vv3SN59Zr8t4OSFfensN_ddgG4KClYSeqPyNQqZVN_BkYVI3EiaxHRKgUUV5WidPyIrjrhyphenhyphenMDK_8Ax2tkCP7FuN5L9T1m0UYDXk6cW_CpzZ3tjNqA2d2GMypECoskKU/s320/Print%20matrix%20solution.png",
        link: "setbrand/print/print-matrix-solution.html",
        category: "Print",
        description: "Expert in Printing CMYk and RGB. Everything at One place.",
        keywords: "print, sticker, visiting card, graphics, banner"
    }
];

// Export to window so script.js can see it
window.allStores = allStores;
