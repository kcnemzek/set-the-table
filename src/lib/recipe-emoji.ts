const CATEGORY_MAP: [string[], string, string][] = [
  // [keywords, emoji, label]
  [["pasta", "spaghetti", "lasagna", "fettuccine", "linguine", "penne", "rigatoni", "ravioli", "gnocchi", "carbonara", "bolognese", "alfredo"], "🍝", "Pasta & Italian"],
  [["pizza", "calzone", "flatbread"], "🍕", "Pizza"],
  [["chicken", "poultry", "hen", "wing", "nugget", "tender"], "🍗", "Chicken"],
  [["burger", "hamburger", "cheeseburger", "patty", "slider"], "🍔", "Burgers"],
  [["sandwich", "sub", "hoagie", "wrap", "panini", "club", "blt", "gyro", "pita"], "🥪", "Sandwiches & Wraps"],
  [["taco", "burrito", "enchilada", "quesadilla", "fajita", "nacho", "tamale", "salsa", "queso", "elote"], "🌮", "Mexican"],
  [["sushi", "sashimi", "maki", "onigiri", "tempura", "ramen", "udon", "miso"], "🍱", "Japanese"],
  [["noodle", "lo mein", "chow mein", "pad thai", "pho", "vermicelli"], "🍜", "Noodles"],
  [["fried rice", "risotto", "paella", "pilaf", "biryani"], "🍚", "Rice Dishes"],
  [["curry", "tikka", "masala", "korma", "dal", "dhal", "chana", "saag", "vindaloo"], "🍛", "Curry & Indian"],
  [["steak", "ribeye", "sirloin", "brisket", "roast beef", "prime rib", "beef", "meatball", "meatloaf"], "🥩", "Beef"],
  [["pork", "bacon", "ham", "prosciutto", "sausage", "bratwurst", "chorizo", "pulled pork", "ribs", "carnitas"], "🥓", "Pork"],
  [["turkey", "thanksgiving"], "🦃", "Turkey"],
  [["lamb", "mutton", "rack of lamb", "shepherd"], "🍖", "Lamb"],
  [["salmon", "tuna", "tilapia", "cod", "halibut", "mahi", "sea bass", "trout", "catfish", "swordfish", "snapper", "flounder"], "🐟", "Fish"],
  [["shrimp", "prawn", "lobster", "crab", "scallop", "clam", "mussel", "oyster", "squid", "calamari", "octopus", "seafood"], "🦐", "Seafood"],
  [["salad", "slaw", "coleslaw", "caesar", "cobb", "caprese", "nicoise"], "🥗", "Salads"],
  [["soup", "stew", "chili", "chowder", "bisque", "broth", "gumbo", "minestrone", "gazpacho", "pozole"], "🍲", "Soups & Stews"],
  [["egg", "omelette", "omelet", "frittata", "quiche", "scrambled", "benedict", "shakshuka", "pancake", "waffle", "crepe", "french toast"], "🍳", "Breakfast"],
  [["bread", "baguette", "focaccia", "biscuit", "roll", "loaf", "brioche", "sourdough"], "🍞", "Bread & Baked"],
  [["pot pie", "empanada", "pasty", "samosa", "dumpling", "pierogi"], "🥟", "Savory Pastry"],
  [["vegetable", "veggie", "stir fry", "stir-fry", "ratatouille", "roasted veg", "corn", "elote", "mushroom", "portobello", "potato", "mashed", "hash", "latke", "gratin", "sweet potato", "yam"], "🥦", "Vegetables"],
  [["mac and cheese", "macaroni and cheese", "grilled cheese", "fondue"], "🧀", "Cheese"],
  [["bean", "lentil", "hummus", "falafel", "chickpea", "black bean", "edamame"], "🫘", "Beans & Legumes"],
  [["cake", "cupcake", "cheesecake", "tiramisu", "mousse", "cookie", "brownie", "biscotti", "macaroon", "pie", "tart", "cobbler", "crisp", "ice cream", "gelato", "sorbet", "sundae", "chocolate", "truffle", "fudge", "donut", "doughnut"], "🍪", "Desserts"],
  [["smoothie", "shake", "juice", "lemonade"], "🥤", "Drinks"],
  [["guacamole", "avocado toast", "bruschetta", "crostini"], "🥑", "Dips & Spreads"],
  [["rice"], "🍚", "Rice Dishes"],
];

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
  [["taco", "burrito", "enchilada", "quesadilla", "fajita", "nacho", "tamale", "salsa", "queso", "elote"], "🌮"],
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

export const CATEGORIES: { emoji: string; label: string }[] = Array.from(
  new Map(CATEGORY_MAP.map(([, emoji, label]) => [label, { emoji, label }])).values()
).concat([{ emoji: "🍽️", label: "Other" }]);

export function getRecipeCategory(title: string, categoryOverride?: string): { emoji: string; label: string } {
  if (categoryOverride) {
    const match = CATEGORIES.find((c) => c.label === categoryOverride);
    if (match) return match;
  }
  const lower = title.toLowerCase();
  for (const [keywords, emoji, label] of CATEGORY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return { emoji, label };
  }
  return { emoji: "🍽️", label: "Other" };
}
