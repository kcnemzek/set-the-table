const EMOJI_MAP: [string[], string][] = [
  // Pasta & Italian
  [["pasta", "spaghetti", "lasagna", "fettuccine", "linguine", "penne", "rigatoni", "ravioli", "gnocchi", "carbonara", "bolognese", "alfredo"], "🍝"],
  // Pizza
  [["pizza", "calzone", "flatbread"], "🍕"],
  // Chicken
  [["chicken", "poultry", "hen", "wing", "nugget", "tender"], "🍗"],
  // Burgers
  [["burger", "hamburger", "cheeseburger", "patty", "slider"], "🍔"],
  // Sandwiches & Wraps
  [["sandwich", "sub", "hoagie", "wrap", "panini", "club", "blt", "gyro", "pita"], "🥪"],
  // Tacos & Mexican
  [["taco", "burrito", "enchilada", "quesadilla", "fajita", "nacho", "tamale", "salsa"], "🌮"],
  // Sushi & Japanese
  [["sushi", "sashimi", "maki", "onigiri", "tempura", "ramen", "udon", "miso"], "🍱"],
  // Noodles
  [["noodle", "lo mein", "chow mein", "pad thai", "pho", "vermicelli"], "🍜"],
  // Rice dishes
  [["fried rice", "risotto", "paella", "pilaf", "biryani"], "🍚"],
  // Curry & Indian
  [["curry", "tikka", "masala", "korma", "dal", "dhal", "chana", "saag", "vindaloo"], "🍛"],
  // Steak & Beef
  [["steak", "ribeye", "sirloin", "brisket", "roast beef", "prime rib"], "🥩"],
  // General beef/pork/meat
  [["beef", "meatball", "meatloaf"], "🥩"],
  // Pork
  [["pork", "bacon", "ham", "prosciutto", "sausage", "bratwurst", "chorizo", "pulled pork", "ribs", "carnitas"], "🥓"],
  // Turkey
  [["turkey", "thanksgiving"], "🦃"],
  // Lamb
  [["lamb", "mutton", "rack of lamb", "shepherd"], "🍖"],
  // Fish
  [["salmon", "tuna", "tilapia", "cod", "halibut", "mahi", "sea bass", "trout", "catfish", "swordfish", "snapper", "flounder"], "🐟"],
  // Shrimp & Seafood
  [["shrimp", "prawn", "lobster", "crab", "scallop", "clam", "mussel", "oyster", "squid", "calamari", "octopus", "seafood"], "🦐"],
  // Salads
  [["salad", "slaw", "coleslaw", "caesar", "cobb", "caprese", "nicoise"], "🥗"],
  // Soups & Stews
  [["soup", "stew", "chili", "chowder", "bisque", "broth", "gumbo", "minestrone", "gazpacho", "pozole"], "🍲"],
  // Eggs & Breakfast
  [["egg", "omelette", "omelet", "frittata", "quiche", "scrambled", "benedict", "shakshuka"], "🍳"],
  // Pancakes & Waffles
  [["pancake", "waffle", "crepe", "french toast"], "🥞"],
  // Bread & Baked
  [["bread", "baguette", "focaccia", "biscuit", "roll", "loaf", "brioche", "sourdough"], "🍞"],
  // Pie & Savory pastry
  [["pot pie", "quiche", "empanada", "pasty", "samosa", "dumpling", "pierogi"], "🥟"],
  // Vegetables
  [["vegetable", "veggie", "stir fry", "stir-fry", "ratatouille", "roasted veg"], "🥦"],
  // Corn
  [["corn", "elote", "succotash"], "🌽"],
  // Mushroom
  [["mushroom", "portobello", "risotto"], "🍄"],
  // Potato
  [["potato", "mashed", "hash", "latke", "gratin"], "🥔"],
  // Sweet potato
  [["sweet potato", "yam"], "🍠"],
  // Cheese
  [["mac and cheese", "macaroni and cheese", "grilled cheese", "fondue"], "🧀"],
  // Beans & Legumes
  [["bean", "lentil", "hummus", "falafel", "chickpea", "black bean", "edamame"], "🫘"],
  // Desserts
  [["cake", "cupcake", "cheesecake", "tiramisu", "mousse"], "🎂"],
  [["cookie", "brownie", "biscotti", "macaroon"], "🍪"],
  [["pie", "tart", "cobbler", "crisp"], "🥧"],
  [["ice cream", "gelato", "sorbet", "sundae"], "🍨"],
  [["chocolate", "truffle", "fudge"], "🍫"],
  [["donut", "doughnut"], "🍩"],
  // Smoothie / drinks
  [["smoothie", "shake", "juice", "lemonade"], "🥤"],
  // Dips & Spreads
  [["guacamole", "avocado toast", "bruschetta", "crostini"], "🥑"],
  // Rice (standalone)
  [["rice"], "🍚"],
  // General fallback
];

export function getRecipeEmoji(title: string): string {
  const lower = title.toLowerCase();
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return emoji;
  }
  return "🍽️";
}
