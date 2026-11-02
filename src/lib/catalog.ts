import type { Product, Variant } from './types'

interface SeedVariant {
  label: string
  price: number
  mrp: number
  stock: number
}

interface SeedProduct {
  name: string
  description: string
  category: string
  emoji: string
  featured?: boolean
  price?: number
  mrp?: number
  unit?: string
  stock?: number
  variants?: SeedVariant[]
}

function mkVariants(vs: SeedVariant[] | undefined, idPrefix: string): Variant[] | undefined {
  if (!vs || vs.length === 0) return undefined
  return vs.map((v, i) => ({ id: `${idPrefix}_v${i + 1}`, ...v }))
}

export const SEED_PRODUCTS: SeedProduct[] = [
  // ---------- Rice & Grains ----------
  {
    name: 'India Gate Basmati Rice (Classic)', description: 'Aged long-grain basmati with a rich aroma — the biryani specialist\u2019s pick.',
    category: 'Rice & Grains', emoji: '🍚', featured: true,
    variants: [
      { label: '1 kg', price: 340, mrp: 420, stock: 50 },
      { label: '5 kg', price: 1620, mrp: 1980, stock: 18 },
    ],
  },
  { name: 'Sona Masoori Rice', description: 'Light everyday rice — goes well with dal, sambar and curd.', category: 'Rice & Grains', emoji: '🍚', price: 85, mrp: 95, unit: '1 kg', stock: 60 },
  {
    name: 'Daawat Rozana Super Basmati', description: 'Everyday basmati that cooks fluffy and non-sticky in minutes.',
    category: 'Rice & Grains', emoji: '🍚',
    variants: [
      { label: '1 kg', price: 155, mrp: 180, stock: 40 },
      { label: '5 kg', price: 735, mrp: 850, stock: 15 },
    ],
  },
  { name: 'Idly Rice (Parboiled)', description: 'Short parboiled grains perfect for soft idly and crisp dosa batter.', category: 'Rice & Grains', emoji: '🍚', price: 78, mrp: 90, unit: '1 kg', stock: 45 },
  { name: 'Brown Rice (Unpolished)', description: 'Fibre-rich unpolished brown rice for a healthier everyday plate.', category: 'Rice & Grains', emoji: '🍚', price: 120, mrp: 145, unit: '1 kg', stock: 25 },
  { name: 'Foxtail Millet (Thinai)', description: 'Nutty millet grain — upma, pongal or pulao, it works everywhere.', category: 'Rice & Grains', emoji: '🌾', price: 95, mrp: 115, unit: '500 g', stock: 30 },

  // ---------- Dals & Pulses ----------
  { name: 'Toor Dal (Arhar) Premium', description: 'Unpolished pigeon pea lentils — thick dal, every single time.', category: 'Dals & Pulses', emoji: '🫘', featured: true,
    variants: [
      { label: '500 g', price: 82, mrp: 95, stock: 45 },
      { label: '1 kg', price: 152, mrp: 180, stock: 45 },
    ],
  },
  { name: 'Chana Dal (Bengal Gram)', description: 'Clean split Bengal gram for dal tadka, besan and sundal.', category: 'Dals & Pulses', emoji: '🫘', price: 92, mrp: 105, unit: '1 kg', stock: 40 },
  { name: 'Moong Dal Dhuli', description: 'Skinless yellow moong — light, easy to digest, khichdi favourite.', category: 'Dals & Pulses', emoji: '🫘', price: 118, mrp: 135, unit: '1 kg', stock: 35 },
  { name: 'Masoor Dal (Red Lentils)', description: 'Quick-cooking red lentils that turn creamy in under 20 minutes.', category: 'Dals & Pulses', emoji: '🫘', price: 96, mrp: 110, unit: '1 kg', stock: 38 },
  { name: 'Urad Dal Gota', description: 'Whole black gram for slow-cooked dal makhani and batter fermentation.', category: 'Dals & Pulses', emoji: '🫘', price: 138, mrp: 160, unit: '500 g', stock: 28 },
  { name: 'Rajma Chitra', description: 'Speckled kidney beans that soak rich and turn buttery soft.', category: 'Dals & Pulses', emoji: '🫘', price: 145, mrp: 168, unit: '500 g', stock: 30 },
  { name: 'Kabuli Chana (Chickpeas)', description: 'Large plump chickpeas for chole, hummus and salads.', category: 'Dals & Pulses', emoji: '🫘', price: 110, mrp: 125, unit: '500 g', stock: 32 },

  // ---------- Atta & Flours ----------
  {
    name: 'Aashirvaad Shudh Chakki Atta', description: 'Stone-ground whole wheat atta for soft rotis that stay soft for hours.',
    category: 'Atta & Flours', emoji: '🌾', featured: true,
    variants: [
      { label: '5 kg', price: 245, mrp: 280, stock: 40 },
      { label: '10 kg', price: 470, mrp: 540, stock: 20 },
    ],
  },
  { name: 'Besan (Gram Flour)', description: 'Fine-milled chickpea flour for pakoras, cheela and mithai.', category: 'Atta & Flours', emoji: '🥣',
    variants: [
      { label: '500 g', price: 65, mrp: 75, stock: 40 },
      { label: '1 kg', price: 122, mrp: 140, stock: 30 },
    ],
  },
  { name: 'Maida (Refined Flour)', description: 'All-purpose refined flour for naan, cakes and bakery-style baking.', category: 'Atta & Flours', emoji: '🥣', price: 58, mrp: 68, unit: '1 kg', stock: 35 },
  { name: 'Rice Flour (Idiyappam)', description: 'Smooth rice flour for idiyappam, puttu and Pathiri.', category: 'Atta & Flours', emoji: '🥣', price: 62, mrp: 72, unit: '1 kg', stock: 30 },
  { name: 'Rava / Suji (Semolina)', description: 'Roasted-ready coarse semolina for upma, idli and halwa.', category: 'Atta & Flours', emoji: '🥣', price: 55, mrp: 65, unit: '500 g', stock: 40 },
  { name: 'Multi Grain Health Mix', description: 'Traditional 12-grain porridge mix — morning energy in one bowl.', category: 'Atta & Flours', emoji: '🥣', price: 210, mrp: 250, unit: '500 g', stock: 18 },

  // ---------- Spices & Masala ----------
  { name: 'Turmeric Powder (Haldi)', description: 'High-curcumin pure haldi powder for colour and immunity.', category: 'Spices & Masala', emoji: '🟡',
    variants: [
      { label: '200 g', price: 35, mrp: 42, stock: 70 },
      { label: '500 g', price: 78, mrp: 95, stock: 45 },
    ],
  },
  { name: 'Red Chilli Powder', description: 'Sun-dried stone-ground chilli powder with a deep red colour.', category: 'Spices & Masala', emoji: '🌶️', featured: true, price: 68, mrp: 80, unit: '200 g', stock: 60 },
  { name: 'Coriander Powder (Dhania)', description: 'Aromatic dhania powder — the base of every everyday curry.', category: 'Spices & Masala', emoji: '🌿', price: 55, mrp: 65, unit: '200 g', stock: 55 },
  { name: 'Everest Garam Masala', description: 'Classic 12-spice roasted blend for rich North Indian flavour.', category: 'Spices & Masala', emoji: '🧉', price: 85, mrp: 95, unit: '100 g', stock: 45 },
  { name: 'Cumin Seeds (Jeera)', description: 'Bold-size jeera that crackles and blooms in hot ghee.', category: 'Spices & Masala', emoji: '🫧', price: 124, mrp: 145, unit: '200 g', stock: 40 },
  { name: 'Mustard Seeds (Rai)', description: 'Black mustard seeds for tadka, pickles and fish curries.', category: 'Spices & Masala', emoji: '⚫', price: 32, mrp: 38, unit: '100 g', stock: 45 },
  { name: 'MDH Chicken Masala', description: 'Signature mix for restaurant-style chicken curry at home.', category: 'Spices & Masala', emoji: '🍗', price: 75, mrp: 85, unit: '100 g', stock: 35 },
  { name: 'Chat Masala', description: 'Khatta-meetha sprinkle for fruits, salads and chaat.', category: 'Spices & Masala', emoji: '🍋', price: 48, mrp: 55, unit: '100 g', stock: 40 },
  { name: 'Tamarind (Seedless)', description: 'Sour, pulp-rich seedless tamarind for sambar and chutneys.', category: 'Spices & Masala', emoji: '🟤',
    variants: [
      { label: '250 g', price: 58, mrp: 70, stock: 35 },
      { label: '500 g', price: 105, mrp: 125, stock: 25 },
    ],
  },
  { name: 'Asafoetida (Hing)', description: 'Strong pure hing — a pinch does the whole tadka.', category: 'Spices & Masala', emoji: '🫙', price: 92, mrp: 110, unit: '50 g', stock: 30 },

  // ---------- Oil & Ghee ----------
  {
    name: 'Fortune Sunflower Oil', description: 'Light refined sunflower oil — everyday frying and cooking.',
    category: 'Oil & Ghee', emoji: '🫒', featured: true,
    variants: [
      { label: '1 L', price: 148, mrp: 170, stock: 50 },
      { label: '5 L', price: 720, mrp: 820, stock: 15 },
    ],
  },
  {
    name: 'Cold Pressed Groundnut Oil', description: 'Wood-pressed (chekku) groundnut oil with a natural nutty aroma.',
    category: 'Oil & Ghee', emoji: '🥜',
    variants: [
      { label: '500 ml', price: 145, mrp: 155, stock: 25 },
      { label: '1 L', price: 285, mrp: 300, stock: 25 },
    ],
  },
  {
    name: 'Cold Pressed Gingelly (Sesame) Oil', description: 'Unrefined sesame oil for South Indian cooking, pickles and body massage.',
    category: 'Oil & Ghee', emoji: '🌻',
    variants: [
      { label: '250 ml', price: 100, mrp: 105, stock: 30 },
      { label: '500 ml', price: 190, mrp: 205, stock: 30 },
      { label: '1 L', price: 370, mrp: 400, stock: 20 },
    ],
  },
  { name: 'Parachute Coconut Oil', description: '100% pure edible coconut oil — kitchen and hair care classic.', category: 'Oil & Ghee', emoji: '🥥', price: 192, mrp: 220, unit: '500 ml', stock: 30 },
  {
    name: 'Amul Pure Ghee', description: 'Grainy cow ghee with a rich roasted aroma — made from fresh cream.',
    category: 'Oil & Ghee', emoji: '🧈', featured: true,
    variants: [
      { label: '200 ml', price: 168, mrp: 185, stock: 30 },
      { label: '1 L', price: 625, mrp: 700, stock: 22 },
    ],
  },
  { name: 'Fortune Kachi Ghani Mustard Oil', description: 'Pungent cold-pressed mustard oil loved in Bengali kitchens.', category: 'Oil & Ghee', emoji: '🌻', price: 182, mrp: 205, unit: '1 L', stock: 30 },

  // ---------- Dairy & Bread ----------
  { name: 'Amul Taaza Milk', description: 'Fresh toned milk pouch, pasteurised and chilled.', category: 'Dairy & Bread', emoji: '🥛', price: 27, mrp: 28, unit: '500 ml', stock: 80 },
  { name: 'Amul Butter', description: 'The classic salted butter — taste of India since 1946.', category: 'Dairy & Bread', emoji: '🧈', featured: true,
    variants: [
      { label: '100 g', price: 58, mrp: 62, stock: 60 },
      { label: '500 g', price: 275, mrp: 295, stock: 25 },
    ],
  },
  { name: 'Amul Masti Dahi', description: 'Thick fresh curd — perfect with parathas and biryani.', category: 'Dairy & Bread', emoji: '🍶', price: 36, mrp: 40, unit: '400 g', stock: 45 },
  { name: 'Amul Cheese Slices', description: 'Smooth processed cheese slices for sandwiches and burgers.', category: 'Dairy & Bread', emoji: '🧀', price: 135, mrp: 150, unit: '200 g', stock: 25 },
  { name: 'Mother Dairy Paneer', description: 'Soft fresh paneer blocks, protein-packed.', category: 'Dairy & Bread', emoji: '🧆', price: 95, mrp: 105, unit: '200 g', stock: 20 },
  { name: 'Britannia Brown Bread', description: 'Soft whole-wheat brown bread loaf.', category: 'Dairy & Bread', emoji: '🍞', price: 45, mrp: 50, unit: '400 g', stock: 30 },
  { name: 'Farm Fresh Eggs', description: 'Protein-rich brown table eggs — tray of six.', category: 'Dairy & Bread', emoji: '🥚', price: 48, mrp: 54, unit: '6 pcs', stock: 40 },

  // ---------- Dry Fruits & Nuts ----------
  {
    name: 'Premium Almonds (Badam)', description: 'Crunchy California almonds — big, even-sized kernels.',
    category: 'Dry Fruits & Nuts', emoji: '🥜',
    variants: [
      { label: '250 g', price: 215, mrp: 250, stock: 30 },
      { label: '500 g', price: 415, mrp: 480, stock: 18 },
    ],
  },
  {
    name: 'Cashew Nuts (W240)', description: 'Whole W240-grade cashews — creamy and premium.',
    category: 'Dry Fruits & Nuts', emoji: '🥜',
    variants: [
      { label: '250 g', price: 245, mrp: 285, stock: 25 },
      { label: '500 g', price: 475, mrp: 550, stock: 15 },
    ],
  },
  { name: 'Black Raisins (Munakka)', description: 'Sweet-seedless black raisins, sun-dried naturally.', category: 'Dry Fruits & Nuts', emoji: '🍇', price: 135, mrp: 160, unit: '250 g', stock: 28 },
  { name: 'Pistachios (Roasted & Salted)', description: 'Roasted pista kernels with a light salt kiss.', category: 'Dry Fruits & Nuts', emoji: '🟢', price: 320, mrp: 375, unit: '250 g', stock: 18 },
  { name: 'Lion Dates (Premium)', description: 'Soft meaty dates — natural sweetness for daily energy.', category: 'Dry Fruits & Nuts', emoji: '🌰', price: 165, mrp: 195, unit: '500 g', stock: 22 },
  { name: 'Walnut Kernels', description: 'Light-colour walnut kernels, crunchy and brain-food famous.', category: 'Dry Fruits & Nuts', emoji: '🥐', price: 340, mrp: 395, unit: '250 g', stock: 16 },

  // ---------- Snacks & Biscuits ----------
  { name: 'Parle-G Original Biscuits', description: 'India\u2019s favourite glucose biscuits — the golden arched genius.', category: 'Snacks & Biscuits', emoji: '🍪', featured: true,
    variants: [
      { label: '250 g', price: 25, mrp: 28, stock: 90 },
      { label: '800 g', price: 80, mrp: 90, stock: 40 },
    ],
  },
  { name: 'Maggi 2-Minute Noodles', description: 'Iconic instant masala noodles — ready in 2 minutes.', category: 'Snacks & Biscuits', emoji: '🍜', featured: true,
    variants: [
      { label: '4 × 70 g', price: 56, mrp: 64, stock: 70 },
      { label: '8 × 70 g', price: 108, mrp: 124, stock: 40 },
    ],
  },
  { name: "Haldiram's Aloo Bhujia", description: 'Crispy potato bhujia — irresistible tea-time snack.', category: 'Snacks & Biscuits', emoji: '🥨', price: 52, mrp: 60, unit: '200 g', stock: 50 },
  { name: "Haldiram's Mathri", description: 'Flaky handmade mathri with pickle-friendly saltiness.', category: 'Snacks & Biscuits', emoji: '🥮', price: 65, mrp: 75, unit: '300 g', stock: 25 },
  { name: 'Britannia Good Day Cashew', description: 'Buttery cookies loaded with cashew pieces.', category: 'Snacks & Biscuits', emoji: '🥠', price: 30, mrp: 35, unit: '200 g', stock: 45 },
  { name: "Lay's Classic Salted", description: 'Thin, crispy potato chips with classic salt.', category: 'Snacks & Biscuits', emoji: '🥔', price: 20, mrp: 20, unit: '52 g', stock: 80 },
  { name: 'Kurkure Masala Munch', description: 'Crunchy corn puffs with tangy masala flavour.', category: 'Snacks & Biscuits', emoji: '🟠', price: 10, mrp: 10, unit: '30 g', stock: 100 },
  { name: 'Unibic Choco Chip Cookies', description: 'Soft-baked cookies loaded with real chocolate chips.', category: 'Snacks & Biscuits', emoji: '🍫', price: 75, mrp: 85, unit: '250 g', stock: 30 },

  // ---------- Beverages ----------
  {
    name: 'Tata Tea Premium', description: 'Blended Assam tea with an aromatic full-bodied taste.',
    category: 'Beverages', emoji: '🍵', featured: true,
    variants: [
      { label: '250 g', price: 78, mrp: 90, stock: 40 },
      { label: '500 g', price: 142, mrp: 165, stock: 40 },
    ],
  },
  { name: 'Bru Instant Coffee', description: 'Rich 70:30 coffee-chicory blend with a deep aroma.', category: 'Beverages', emoji: '☕', price: 265, mrp: 300, unit: '100 g', stock: 30 },
  { name: 'Nescafé Classic', description: '100% pure instant coffee with deep roasted notes.', category: 'Beverages', emoji: '☕', price: 330, mrp: 360, unit: '100 g', stock: 22 },
  { name: 'Real Mixed Fruit Juice', description: 'Pet-packed mixed fruit juice with 16 fruits inside.', category: 'Beverages', emoji: '🧃', price: 110, mrp: 125, unit: '1 L', stock: 35 },
  { name: 'Thums Up', description: 'Strong fizzy cola — the taste of thunder.', category: 'Beverages', emoji: '🥤', price: 40, mrp: 45, unit: '750 ml', stock: 60 },
  { name: 'Bisleri Mineral Water', description: 'Safe and pure packaged drinking water.', category: 'Beverages', emoji: '💧', price: 20, mrp: 20, unit: '1 L', stock: 100 },
  { name: 'Boost Energy Drink', description: 'Chocolate-flavoured malt drink — Stamina of champions.', category: 'Beverages', emoji: '🥛', price: 235, mrp: 265, unit: '500 g', stock: 20 },
  { name: 'Green Tea (Tulsi)', description: 'Soothing tulsi green tea for a calm, healthy sip.', category: 'Beverages', emoji: '🍃', price: 145, mrp: 170, unit: '100 g', stock: 25 },

  // ---------- Fresh Produce ----------
  { name: 'Onions (Pyaz)', description: 'Farm-fresh medium onions, hand-picked quality.', category: 'Fresh Produce', emoji: '🧅', featured: true,
    variants: [
      { label: '1 kg', price: 42, mrp: 50, stock: 60 },
      { label: '5 kg', price: 195, mrp: 235, stock: 20 },
    ],
  },
  { name: 'Tomatoes (Tamatar)', description: 'Juicy ripe tomatoes for curries, salads and chutney.', category: 'Fresh Produce', emoji: '🍅', price: 38, mrp: 48, unit: '1 kg', stock: 50 },
  { name: 'Potatoes (Aloo)', description: 'Fresh table potatoes — all-purpose kitchen staple.', category: 'Fresh Produce', emoji: '🥔', price: 34, mrp: 40, unit: '1 kg', stock: 65 },
  { name: 'Green Chillies', description: 'Spicy fresh green chillies for tempering.', category: 'Fresh Produce', emoji: '🌿', price: 20, mrp: 25, unit: '100 g', stock: 40 },
  { name: 'Ginger (Adrak)', description: 'Fresh ginger root with a strong zesty punch.', category: 'Fresh Produce', emoji: '🫚', price: 45, mrp: 55, unit: '250 g', stock: 35 },
  { name: 'Coriander Leaves', description: 'Fresh dhania patta bunch for garnishing.', category: 'Fresh Produce', emoji: '🌿', price: 12, mrp: 15, unit: '1 bunch', stock: 45 },
  { name: 'Lemons', description: 'Juicy thin-skin lemons full of tang.', category: 'Fresh Produce', emoji: '🍋', price: 30, mrp: 38, unit: '250 g', stock: 35 },
  { name: 'Bananas (Robusta)', description: 'Naturally ripened robusta bananas — energy on the go.', category: 'Fresh Produce', emoji: '🍌', price: 48, mrp: 55, unit: '6 pcs', stock: 40 },

  // ---------- Sweets ----------
  { name: "Haldiram's Soan Papdi", description: 'Flaky melt-in-mouth soan papdi with elaichi flavour.', category: 'Sweets', emoji: '🍬', featured: true,
    variants: [
      { label: '250 g', price: 55, mrp: 65, stock: 40 },
      { label: '500 g', price: 88, mrp: 100, stock: 30 },
    ],
  },
  { name: 'Gulab Jamun Tin', description: 'Ready-to-eat gulab jamuns in sugar syrup.', category: 'Sweets', emoji: '🟤', price: 165, mrp: 190, unit: '500 g', stock: 18 },
  { name: 'Amul Shrikhand (Kesar)', description: 'Creamy saffron sweetened curd dessert.', category: 'Sweets', emoji: '🍮', price: 78, mrp: 85, unit: '250 g', stock: 15 },
  { name: 'Mysore Pak', description: 'Ghee-rich gram-flour square that melts instantly.', category: 'Sweets', emoji: '🟡', price: 185, mrp: 215, unit: '400 g', stock: 14 },

  // ---------- Personal Care ----------
  { name: 'Colgate Strong Teeth', description: 'Anti-cavity toothpaste with amino shakti.', category: 'Personal Care', emoji: '🪥', price: 110, mrp: 125, unit: '200 g', stock: 45 },
  { name: 'Lifebuoy Total Soap', description: 'Germ-protection bathing bar for the whole family.', category: 'Personal Care', emoji: '🧼',
    variants: [
      { label: 'Single 125 g', price: 36, mrp: 40, stock: 60 },
      { label: 'Pack of 4', price: 132, mrp: 150, stock: 35 },
    ],
  },
  { name: 'Clinic Plus Shampoo', description: 'Herbal shampoo for strong, healthy hair.', category: 'Personal Care', emoji: '🧴', price: 68, mrp: 78, unit: '175 ml', stock: 30 },
  { name: 'Nycil Prickly Heat Powder', description: 'Cooling talc with neem for Indian summers.', category: 'Personal Care', emoji: '❄️', price: 52, mrp: 60, unit: '150 g', stock: 20 },
  { name: 'Dettol Handwash Refill', description: 'Kills 99.9% germs — liquid handwash refill pack.', category: 'Personal Care', emoji: '🧼', price: 99, mrp: 115, unit: '750 ml', stock: 30 },
  { name: 'Vaseline Body Lotion', description: 'Deep-moisture body lotion for dry skin days.', category: 'Personal Care', emoji: '🧴', price: 165, mrp: 195, unit: '300 ml', stock: 22 },

  // ---------- Household ----------
  {
    name: 'Surf Excel Easy Wash', description: 'Tough-stain detergent powder for bucket wash.',
    category: 'Household', emoji: '🧺', featured: true,
    variants: [
      { label: '500 g', price: 62, mrp: 70, stock: 35 },
      { label: '1 kg', price: 115, mrp: 130, stock: 35 },
      { label: '2 kg', price: 218, mrp: 248, stock: 20 },
    ],
  },
  { name: 'Vim Dishwash Bar', description: 'Lemon-powered dishwash bar that cuts grease fast.', category: 'Household', emoji: '🍋',
    variants: [
      { label: 'Single 300 g', price: 22, mrp: 25, stock: 70 },
      { label: 'Pack of 3', price: 60, mrp: 72, stock: 40 },
    ],
  },
  { name: 'Harpic Power Plus', description: 'Thick disinfectant toilet cleaner — original.', category: 'Household', emoji: '🚽', price: 96, mrp: 110, unit: '1 L', stock: 25 },
  { name: 'Lizol Floor Cleaner (Citrus)', description: 'Kills 99.9% germs, fresh citrus floor cleaner.', category: 'Household', emoji: '🧽', price: 145, mrp: 168, unit: '975 ml', stock: 22 },
  { name: 'Good Knight Gold Refill', description: 'Mosquito repellent liquid vaporiser refill.', category: 'Household', emoji: '🦟', price: 78, mrp: 90, unit: '45 ml', stock: 30 },
  { name: 'Scotch-Brite Scrub Pad', description: 'Non-scratch multi-purpose kitchen scrub sponge.', category: 'Household', emoji: '🧴', price: 45, mrp: 52, unit: '3 pcs', stock: 35 },
  { name: 'Odonil Air Freshener', description: 'Bathroom and room fragrance blocks — mixed flowers.', category: 'Household', emoji: '🌸', price: 88, mrp: 100, unit: '3 × 50 g', stock: 24 },

  // ---------- Pooja Needs ----------
  { name: 'Sandal Agarbatti', description: 'Classic sandalwood incense sticks for daily pooja.', category: 'Pooja Needs', emoji: '🪔',
    variants: [
      { label: '100 g', price: 55, mrp: 75, stock: 40 },
      { label: '250 g', price: 120, mrp: 150, stock: 25 },
    ],
  },
  { name: 'Camphor (Kapur) Tablets', description: 'Pure camphor tablets for aarti and pooja.', category: 'Pooja Needs', emoji: '⚪',
    variants: [
      { label: '25 g', price: 35, mrp: 45, stock: 45 },
      { label: '50 g', price: 68, mrp: 80, stock: 30 },
    ],
  },
  { name: 'Cup Sambrani (Dhoop)', description: 'Sambrani cups that fill the home with temple-like fragrance.', category: 'Pooja Needs', emoji: '🪔', price: 50, mrp: 70, unit: '12 cups', stock: 30 },
  { name: 'Cotton Wicks (Diya Batti)', description: 'Long-stay cotton wicks for lamps — 2 sizes in pack.', category: 'Pooja Needs', emoji: '🕯️', price: 30, mrp: 38, unit: '200 pcs', stock: 40 },
  { name: 'Pooja Oil (Lamp) 500 ml', description: 'Clean-burning lamp oil for daily deepam.', category: 'Pooja Needs', emoji: '🛢️', price: 85, mrp: 100, unit: '500 ml', stock: 25 },

  // ---------- Baby Care ----------
  { name: 'Himalaya Baby Powder', description: 'Gentle talc with clinically tested herbal actives.', category: 'Baby Care', emoji: '🍼', price: 145, mrp: 165, unit: '200 g', stock: 25 },
  { name: 'Pampers Pants (Medium)', description: 'All-round softness diapers for 7–12 kg babies.', category: 'Baby Care', emoji: '👶',
    variants: [
      { label: '18 pants', price: 245, mrp: 280, stock: 20 },
      { label: '44 pants', price: 545, mrp: 630, stock: 12 },
    ],
  },
  { name: 'Johnson\u2019s Baby Soap', description: 'Mild baby soap with 100% gentle care formula.', category: 'Baby Care', emoji: '🧼', price: 58, mrp: 68, unit: '100 g', stock: 35 },
  { name: 'Cerelac Wheat & Honey', description: 'Iron-fortified first cereal for 6-month-plus babies.', category: 'Baby Care', emoji: '🥣', price: 285, mrp: 310, unit: '300 g', stock: 18 },
  { name: 'Himalaya Baby Lotion', description: 'Light non-sticky lotion for delicate skin.', category: 'Baby Care', emoji: '🧴', price: 168, mrp: 190, unit: '200 ml', stock: 20 },
]

export function buildSeedProducts(): Product[] {
  const now = new Date().toISOString()
  return SEED_PRODUCTS.map((p, i) => {
    const variants = mkVariants(p.variants, `s${i + 1}`)
    // base fields mirror the first variant for display/sorting consistency
    const first = variants?.[0]
    return {
      id: `seed_${String(i + 1).padStart(3, '0')}`,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price ?? first?.price ?? 0,
      mrp: p.mrp ?? first?.mrp ?? 0,
      unit: p.unit ?? first?.label ?? '1 pc',
      stock: p.stock ?? first?.stock ?? 0,
      emoji: p.emoji,
      featured: p.featured ?? false,
      variants,
      createdAt: now,
    }
  })
}
