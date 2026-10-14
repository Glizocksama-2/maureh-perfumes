import os
import json
import numpy as np
from PIL import Image, ImageEnhance

SRC_FOLDER = r'F:\perfumes'
OUT_FOLDER = r'public\images\products'
os.makedirs(OUT_FOLDER, exist_ok=True)

products = [
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.13.16.jpeg',
        'slug': 'afnan-9pm',
        'id': 'mrh-afnan-9pm',
        'name': '9 PM',
        'brand': 'Afnan',
        'subtitle': 'Eau de Parfum • Bubblegum, Crisp Apple & Warm Vanilla',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Amber Vanilla',
        'concentration': 'Eau de Parfum',
        'priceKES': 4800,
        'originalPriceKES': 5500,
        'rating': 4.94,
        'reviewsCount': 420,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'The viral sensation and King of evening fragrances. Opens with fresh wild apple, cinnamon, and bergamot before settling into luscious vanilla, tonka bean, and warm amber. Unstoppable sillage and compliment factor.',
        'notes': {
            'top': ['Apple', 'Cinnamon', 'Wild Lavender', 'Bergamot'],
            'heart': ['Orange Blossom', 'Lily of the Valley'],
            'base': ['Vanilla', 'Tonka Bean', 'Amber', 'Patchouli']
        },
        'performance': {
            'sillage': 'Enormous Projection',
            'longevity': '10-12 Hours',
            'season': 'Evening • Date Night • Clubbing',
            'occasion': 'Parties, Evenings, Casual Luxury'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 950},
            {'size': '100ml Bottle', 'priceKES': 4800, 'isDefault': True}
        ],
        'accords': ['Vanilla', 'Sweet', 'Fruity', 'Warm Spicy', 'Amber']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.17.51.jpeg',
        'slug': 'lattafa-eclaire',
        'id': 'mrh-lattafa-eclaire',
        'name': 'Eclaire',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Creamy Caramel, Milk & Golden Honey',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Gourmand Sweet',
        'concentration': 'Eau de Parfum',
        'priceKES': 5200,
        'originalPriceKES': 6000,
        'rating': 4.97,
        'reviewsCount': 380,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'A heavenly dessert in a bottle and worldwide TikTok sensation. Dripping with warm golden caramel, condensed milk, sweet praline, and fluffy Madagascar vanilla. Indulgently sweet, comforting, and addictive.',
        'notes': {
            'top': ['Caramel', 'Milk', 'Sugar'],
            'heart': ['White Flowers', 'Honey'],
            'base': ['Vanilla', 'Praline', 'Musk']
        },
        'performance': {
            'sillage': 'Intimate & Tempting Radiance',
            'longevity': '10+ Hours',
            'season': 'All-Season • Cooler Days',
            'occasion': 'Daily Indulgence, Romance, Cozy Evenings'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1100},
            {'size': '100ml Bottle', 'priceKES': 5200, 'isDefault': True}
        ],
        'accords': ['Caramel', 'Sweet', 'Vanilla', 'Lactonic', 'Honey']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.22.21.jpeg',
        'slug': 'afnan-9pm-elixir',
        'id': 'mrh-afnan-9pm-elixir',
        'name': '9 PM Elixir',
        'brand': 'Afnan',
        'subtitle': 'Parfum Intense • Dark Spices, Amberwood & Smoky Tonka',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Oriental Amber',
        'concentration': 'Parfum Intense',
        'priceKES': 6800,
        'originalPriceKES': 7800,
        'rating': 4.96,
        'reviewsCount': 195,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'The richer, darker, and more concentrated evolution of 9 PM. Deepened with exotic saffron, dark rum accords, roasted tonka bean, and velvety smoked woods for an ultra-prestigious masculine presence.',
        'notes': {
            'top': ['Saffron', 'Cardamom', 'Nutmeg', 'Blood Orange'],
            'heart': ['Cognac Accord', 'Cashmere Wood', 'Lavender'],
            'base': ['Dark Vanilla', 'Smoked Tonka', 'Amber Extreme', 'Cedar']
        },
        'performance': {
            'sillage': 'Heavy Room-Filler',
            'longevity': '14+ Hours Beast',
            'season': 'Autumn • Winter • VIP Nights',
            'occasion': 'High-End Dinners, Red Carpet, Night Out'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1300},
            {'size': '100ml Bottle', 'priceKES': 6800, 'isDefault': True}
        ],
        'accords': ['Amber', 'Warm Spicy', 'Vanilla', 'Woody', 'Sweet']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.41.04.jpeg',
        'slug': 'lattafa-khamrah',
        'id': 'mrh-lattafa-khamrah',
        'name': 'Khamrah',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Sweet Dates, Cinnamon Bark & Boozy Praline',
        'gender': 'Unisex',
        'category': 'Unisex',
        'family': 'Warm Gourmand Amber',
        'concentration': 'Eau de Parfum',
        'priceKES': 5500,
        'originalPriceKES': 6500,
        'rating': 4.98,
        'reviewsCount': 890,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'One of the most celebrated fragrances in modern perfumery. Encased in a cut-crystal flacon, it unfolds with warm cinnamon, nutmeg, sweet medjool dates, praline, and creamy vanilla-myrrh. Liquid gold on skin.',
        'notes': {
            'top': ['Cinnamon', 'Nutmeg', 'Bergamot'],
            'heart': ['Dates', 'Praline', 'Tuberose', 'Mahonial'],
            'base': ['Vanilla', 'Tonka Bean', 'Benzoin', 'Myrrh', 'Amberwood', 'Akigalawood']
        },
        'performance': {
            'sillage': 'Powerhouse Sillage',
            'longevity': '12-14 Hours',
            'season': 'Cool Evenings • Special Events',
            'occasion': 'Celebrations, Dinners, Luxury Signatures'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1150},
            {'size': '100ml Bottle', 'priceKES': 5500, 'isDefault': True}
        ],
        'accords': ['Warm Spicy', 'Sweet', 'Vanilla', 'Cinnamon', 'Amber']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.45.40.jpeg',
        'slug': 'ramz-lattafa-silver',
        'id': 'mrh-ramz-silver',
        'name': 'Ramz Lattafa (Silver)',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Sweet Pear, Mint Crisp & Smooth Vanilla',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Fruity Amber',
        'concentration': 'Eau de Parfum',
        'priceKES': 3500,
        'originalPriceKES': 4200,
        'rating': 4.88,
        'reviewsCount': 260,
        'inStock': True,
        'isBestseller': False,
        'isNew': False,
        'description': 'An energetic, magnetic scent inspired by youthful luxury. Crisp pear and refreshing mint blend seamlessly into aromatic cardamom, lavender, and a sensual base of vanilla and amber.',
        'notes': {
            'top': ['Pear', 'Lavender', 'Bergamot', 'Mint'],
            'heart': ['Cardamom', 'Sage'],
            'base': ['Vanilla', 'Amber', 'Musk', 'Patchouli']
        },
        'performance': {
            'sillage': 'Strong & Playful',
            'longevity': '8-10 Hours',
            'season': 'Versatile All-Year',
            'occasion': 'Daily Wear, Casual Hangouts, Evening'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 750},
            {'size': '100ml Bottle', 'priceKES': 3500, 'isDefault': True}
        ],
        'accords': ['Sweet', 'Fruity', 'Vanilla', 'Aromatic', 'Warm Spicy']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.46.10.jpeg',
        'slug': 'qissa-delicious',
        'id': 'mrh-qissa-delicious',
        'name': 'Qissa Delicious',
        'brand': 'Paris Corner',
        'subtitle': 'Eau de Parfum • Whipped Cream, Dark Chocolate & Orange Blossom',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Gourmand Floral',
        'concentration': 'Eau de Parfum',
        'priceKES': 4800,
        'originalPriceKES': 5600,
        'rating': 4.93,
        'reviewsCount': 310,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'A mouth-watering indulgence housed in a majestic ribbed bronze flacon. Layers of rich cocoa, whipped marshmallow cream, juicy orange, and toasted almonds melt into velvety vanilla musk.',
        'notes': {
            'top': ['Dark Chocolate', 'Orange', 'Whipped Cream'],
            'heart': ['Coconut', 'Marshmallow', 'Jasmine', 'Floral Accords'],
            'base': ['Vanilla', 'Soft Woods', 'White Musk', 'Amber']
        },
        'performance': {
            'sillage': 'Sweet Seductive Trail',
            'longevity': '9-11 Hours',
            'season': 'All-Season • Date Nights',
            'occasion': 'Social Outings, Dates, Gourmand Lovers'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1000},
            {'size': '100ml Bottle', 'priceKES': 4800, 'isDefault': True}
        ],
        'accords': ['Chocolate', 'Sweet', 'Vanilla', 'Cacao', 'Warm']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.46.33.jpeg',
        'slug': 'baccarat-rouge-540',
        'id': 'mrh-mfk-br540',
        'name': 'Baccarat Rouge 540',
        'brand': 'Maison Francis Kurkdjian',
        'subtitle': 'Eau de Parfum • French Haute Parfumerie Masterpiece',
        'gender': 'Unisex',
        'category': 'Niche & Haute',
        'family': 'Amber Floral Woody',
        'concentration': 'Eau de Parfum',
        'priceKES': 42000,
        'originalPriceKES': 48000,
        'rating': 4.99,
        'reviewsCount': 610,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'The benchmark of modern luxury perfumery. Luminous aerial notes of jasmine and golden saffron halo mineral facets of ambergris and fresh-cut cedarwood. Unmistakable, mesmerizing, and supremely prestigious.',
        'notes': {
            'top': ['Grandiflorum Jasmine', 'Saffron'],
            'heart': ['Bitter Almond', 'Cedarwood'],
            'base': ['Ambergris', 'Woody Musk', 'Fir Resin']
        },
        'performance': {
            'sillage': 'Ethereal Infinite Sillage',
            'longevity': '16+ Hours',
            'season': 'All-Season High Luxury',
            'occasion': 'Gala Receptions, Executive Presence, Signature Scent'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 6500},
            {'size': '70ml Bottle', 'priceKES': 42000, 'isDefault': True}
        ],
        'accords': ['Woody', 'Amber', 'Warm Spicy', 'Fresh Spicy', 'Metallic']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.46.55.jpeg',
        'slug': 'elysia-elegance',
        'id': 'mrh-elysia-elegance',
        'name': 'Elysia Elegance',
        'brand': 'Fragrance World',
        'subtitle': 'Eau de Parfum • Royal Lychee, Peony Blossom & Cashmeran',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Floral Fruity',
        'concentration': 'Eau de Parfum',
        'priceKES': 4200,
        'originalPriceKES': 4900,
        'rating': 4.89,
        'reviewsCount': 140,
        'inStock': True,
        'isBestseller': False,
        'isNew': True,
        'description': 'An exquisite tribute to modern femininity. Shimmering Turkish rose and velvet peonies are enlivened by crisp lychee, tart rhubarb, and cozy cashmeran with clean white musk.',
        'notes': {
            'top': ['Lychee', 'Rhubarb', 'Bergamot', 'Nutmeg'],
            'heart': ['Turkish Rose', 'Peony', 'Musk', 'Petalia'],
            'base': ['Cashmeran', 'Cedar', 'Haitian Vetiver', 'Incense']
        },
        'performance': {
            'sillage': 'Elegant Radiant Aura',
            'longevity': '8-10 Hours',
            'season': 'Spring • Summer • Daytime',
            'occasion': 'Brunch, Weddings, Office Elegance'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 900},
            {'size': '100ml Bottle', 'priceKES': 4200, 'isDefault': True}
        ],
        'accords': ['Rose', 'Floral', 'Fruity', 'Fresh', 'Musky']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.47.14.jpeg',
        'slug': 'lattafa-hayaati',
        'id': 'mrh-lattafa-hayaati',
        'name': 'Hayaati (Black)',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Crisp Green Apple, Spiced Woods & Marine Freshness',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Woody Aromatic',
        'concentration': 'Eau de Parfum',
        'priceKES': 3400,
        'originalPriceKES': 4000,
        'rating': 4.91,
        'reviewsCount': 510,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'A crowd-pleasing champion with phenomenal everyday versatility. Crisp green apple and bergamot meet warm cinnamon and woody amber for a fresh, confident masculine aura that lasts all day.',
        'notes': {
            'top': ['Apple', 'Bergamot'],
            'heart': ['Cinnamon', 'Woody Notes'],
            'base': ['Vanilla', 'Musk']
        },
        'performance': {
            'sillage': 'Moderate to Strong',
            'longevity': '8-10 Hours',
            'season': 'All-Year Versatile',
            'occasion': 'Workplace, Gym, Daily Signature'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 700},
            {'size': '100ml Bottle', 'priceKES': 3400, 'isDefault': True}
        ],
        'accords': ['Fruity', 'Woody', 'Warm Spicy', 'Fresh', 'Vanilla']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.47.34.jpeg',
        'slug': 'armaf-uniq-effects',
        'id': 'mrh-armaf-uniq',
        'name': 'Effects of Úniq',
        'brand': 'Armaf',
        'subtitle': 'Eau de Parfum • Royal Saffron, Crimson Rose & Smoked Amber',
        'gender': 'Unisex',
        'category': 'Arabian Oud',
        'family': 'Oriental Spicy',
        'concentration': 'Eau de Parfum',
        'priceKES': 6800,
        'originalPriceKES': 7800,
        'rating': 4.92,
        'reviewsCount': 115,
        'inStock': True,
        'isBestseller': False,
        'isNew': True,
        'description': 'A luxury statement release from Armaf’s prestigious Úniq private collection. Housed in an embossed crimson flacon with gold trimming, it delivers opulent saffron, velvety damask rose, and smoldering amber.',
        'notes': {
            'top': ['Saffron', 'Pink Pepper', 'Bergamot'],
            'heart': ['Damask Rose', 'Smoky Incense', 'Nutmeg'],
            'base': ['Ambergris', 'Sandalwood', 'Vanilla', 'Dry Woods']
        },
        'performance': {
            'sillage': 'Heavy & Refined',
            'longevity': '12+ Hours',
            'season': 'Evening • Formal Nights',
            'occasion': 'Bespoke Gatherings, Gala Events'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1350},
            {'size': '100ml Bottle', 'priceKES': 6800, 'isDefault': True}
        ],
        'accords': ['Warm Spicy', 'Rose', 'Amber', 'Woody', 'Balsamic']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.48.05.jpeg',
        'slug': 'lattafa-angham',
        'id': 'mrh-lattafa-angham',
        'name': 'Angham',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Musical Notes of Warm Vanilla, Lavender & Ginger',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Aromatic Vanilla Gourmand',
        'concentration': 'Eau de Parfum',
        'priceKES': 5200,
        'originalPriceKES': 6200,
        'rating': 4.95,
        'reviewsCount': 270,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'Inspired by melodic harmony and luxury French vanilla perfumery. Harmonizes luminous ginger, delicate French lavender, sweet praline, and a triple-infusion of vanilla. A captivating, magnetic feminine signature.',
        'notes': {
            'top': ['Ginger', 'Mandarin Orange', 'Pink Pepper'],
            'heart': ['Lavender', 'Jasmine', 'Praline'],
            'base': ['Madagascar Vanilla', 'Amber', 'Sandalwood']
        },
        'performance': {
            'sillage': 'Sophisticated Radiance',
            'longevity': '10-12 Hours',
            'season': 'All-Season • Daytime & Night',
            'occasion': 'Daily Luxury, High Tea, Evening Dinners'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1100},
            {'size': '100ml Bottle', 'priceKES': 5200, 'isDefault': True}
        ],
        'accords': ['Vanilla', 'Lavender', 'Warm Spicy', 'Sweet', 'Aromatic']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.49.24.jpeg',
        'slug': 'armaf-odyssey-aqua',
        'id': 'mrh-odyssey-aqua',
        'name': 'Odyssey Aqua',
        'brand': 'Armaf',
        'subtitle': 'Eau de Parfum • Coastal Breeze, Crisp Mint & Ambroxan',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Fresh Aquatic Aromatic',
        'concentration': 'Eau de Parfum',
        'priceKES': 4400,
        'originalPriceKES': 5000,
        'rating': 4.90,
        'reviewsCount': 230,
        'inStock': True,
        'isBestseller': False,
        'isNew': False,
        'description': 'The ultimate high-energy fresh aquatic for Nairobi’s sunny days. Zesty grapefruit, wild mint, and marine chords ride on an addictive base of Ambroxan and earthy cypress wood.',
        'notes': {
            'top': ['Grapefruit', 'Orange', 'Artemisia'],
            'heart': ['Mint', 'Lavender', 'Marine Notes'],
            'base': ['Ambroxan', 'Cypress', 'Patchouli']
        },
        'performance': {
            'sillage': 'Invigorating Projection',
            'longevity': '8-10 Hours',
            'season': 'Warm Days • Active Lifestyles',
            'occasion': 'Gym, Office, Casual Weekends, Sports'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 900},
            {'size': '100ml Bottle', 'priceKES': 4400, 'isDefault': True}
        ],
        'accords': ['Aquatic', 'Citrus', 'Fresh Spicy', 'Aromatic', 'Amber']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.49.55.jpeg',
        'slug': 'armaf-odyssey-homme',
        'id': 'mrh-odyssey-homme',
        'name': 'Odyssey Homme',
        'brand': 'Armaf',
        'subtitle': 'Eau de Parfum • Iris Powder, Dark Amber & Vanilla Leather',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Oriental Woody',
        'concentration': 'Eau de Parfum',
        'priceKES': 4400,
        'originalPriceKES': 5000,
        'rating': 4.93,
        'reviewsCount': 360,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'A dark, seductive winter powerhouse reminiscent of Tom Ford Noir Extreme and Dior Homme. Creamy vanilla, powdery iris, dark spices, and smooth amber create an irresistible aura of masculine sophistication.',
        'notes': {
            'top': ['Amber', 'Vanilla'],
            'heart': ['Iris', 'Spices', 'Oriental Accords'],
            'base': ['Vanilla', 'Leather', 'Jasmine']
        },
        'performance': {
            'sillage': 'Cozy Strong Trail',
            'longevity': '10+ Hours',
            'season': 'Cool Evenings • Formal Events',
            'occasion': 'Executive Meetings, Romantic Dates, Night Out'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 900},
            {'size': '100ml Bottle', 'priceKES': 4400, 'isDefault': True}
        ],
        'accords': ['Vanilla', 'Amber', 'Iris', 'Powdery', 'Warm Spicy']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.50.27.jpeg',
        'slug': 'rave-now-black',
        'id': 'mrh-rave-now',
        'name': 'Rave Now',
        'brand': 'Rave',
        'subtitle': 'Eau de Parfum • Hyper-Juicy Pineapple & Smoked Birch',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Fruity Woody',
        'concentration': 'Eau de Parfum',
        'priceKES': 3600,
        'originalPriceKES': 4400,
        'rating': 4.92,
        'reviewsCount': 540,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'Famous worldwide as the juicy pineapple explosion. Dazzling sweet pineapple and blackcurrant collide with smoky birch, patchouli, and sensual ambergris. Unbelievable performance at an accessible price.',
        'notes': {
            'top': ['Juicy Pineapple', 'Blackcurrant', 'Bergamot', 'Apple'],
            'heart': ['Birch', 'Patchouli', 'Jasmine'],
            'base': ['Musk', 'Oakmoss', 'Ambergris', 'Vanilla']
        },
        'performance': {
            'sillage': 'Loud & Compliment Magnet',
            'longevity': '9-11 Hours',
            'season': 'All-Season High Energy',
            'occasion': 'Daywear, Hanging Out, Parties'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 750},
            {'size': '100ml Bottle', 'priceKES': 3600, 'isDefault': True}
        ],
        'accords': ['Fruity', 'Sweet', 'Woody', 'Smoky', 'Tropical']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.50.59.jpeg',
        'slug': 'lattafa-asad',
        'id': 'mrh-lattafa-asad',
        'name': 'Asad',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Spicy, Amber, Warm & Slightly Vanilla-Like',
        'gender': 'Men',
        'category': 'Men',
        'family': 'Spicy Warm Amber',
        'concentration': 'Eau de Parfum',
        'priceKES': 3800,
        'originalPriceKES': 4600,
        'rating': 4.95,
        'reviewsCount': 920,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'Asad is a bold, masculine-leaning fragrance built for those who command attention. Fiery black pepper and tobacco open strong, giving way to roasted coffee and patchouli, before settling into a rich amber and vanilla base. Strong projection that lasts around 7–10+ hours.',
        'notes': {
            'top': ['Black Pepper', 'Pineapple', 'Tobacco'],
            'heart': ['Coffee', 'Patchouli', 'Iris'],
            'base': ['Amber', 'Vanilla', 'Dry Woods', 'Benzoin', 'Labdanum']
        },
        'performance': {
            'sillage': 'Strong',
            'longevity': 'Around 7–10+ hours',
            'season': 'Evening • Cold Days • Night Out',
            'occasion': 'Night Events, Date Night, Bold Daily Wear'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 800},
            {'size': '100ml Bottle', 'priceKES': 3800, 'isDefault': True}
        ],
        'accords': ['Spicy', 'Amber', 'Warm', 'Vanilla', 'Woody']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.51.30.jpeg',
        'slug': 'ard-al-zaafaran-mousuf',
        'id': 'mrh-mousuf',
        'name': 'Mousuf',
        'brand': 'Ard Al Zaafaran',
        'subtitle': 'Eau de Parfum • Sweet, Fruity, Rich',
        'gender': 'Unisex',
        'category': 'Unisex',
        'family': 'Sweet Fruity Rich',
        'concentration': 'Eau de Parfum',
        'priceKES': 3200,
        'originalPriceKES': 3800,
        'rating': 4.88,
        'reviewsCount': 440,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'Mousuf is a sweet, fruity, and rich Arabic fragrance from Ard Al Zaafaran. Luscious grapes, milk chocolate, and caramel unfold over soft oud and musk, creating an indulgent Middle Eastern classic. Gender depends on the version — this one works beautifully on all. Moderate-strong projection lasting around 5–9 hours.',
        'notes': {
            'top': ['Fresh Grapes', 'Chocolate Accord'],
            'heart': ['Caramel', 'Floral Notes'],
            'base': ['Oud', 'Musk', 'Sandalwood']
        },
        'performance': {
            'sillage': 'Moderate–Strong',
            'longevity': 'Around 5–9 hours',
            'season': 'Cool Evenings • All-Season',
            'occasion': 'Daily Luxury, Comfort Wear, Cultural Events'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 700},
            {'size': '100ml Bottle', 'priceKES': 3200, 'isDefault': True}
        ],
        'accords': ['Sweet', 'Fruity', 'Rich', 'Caramel', 'Oud']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.51.59.jpeg',
        'slug': 'ramz-lattafa-gold',
        'id': 'mrh-ramz-gold',
        'name': 'Ramz Gold',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Sweet, Fruity, Warm Amber',
        'gender': 'Unisex',
        'category': 'Unisex',
        'family': 'Sweet Fruity Warm Amber',
        'concentration': 'Eau de Parfum',
        'priceKES': 3500,
        'originalPriceKES': 4200,
        'rating': 4.87,
        'reviewsCount': 210,
        'inStock': True,
        'isBestseller': False,
        'isNew': False,
        'description': 'Ramz Gold is a sweet, fruity, and warm amber fragrance that works beautifully across genders. Sun-ripened apple, peach, and sweet orange open into jasmine and rose before settling into a rich amber and vanilla base. Moderate-strong projection lasting around 6–9 hours.',
        'notes': {
            'top': ['Apple', 'Peach', 'Pear', 'Sweet Orange'],
            'heart': ['Jasmine', 'Rose', 'Sandalwood'],
            'base': ['White Musk', 'Vanilla', 'Amber', 'Patchouli']
        },
        'performance': {
            'sillage': 'Moderate–Strong',
            'longevity': 'Around 6–9 hours',
            'season': 'Spring • Summer • All-Season',
            'occasion': 'Daily Wear, Office, Social Occasions'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 750},
            {'size': '100ml Bottle', 'priceKES': 3500, 'isDefault': True}
        ],
        'accords': ['Sweet', 'Fruity', 'Warm Amber', 'Vanilla', 'Musky']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.52.41.jpeg',
        'slug': 'lattafa-yara-pink',
        'id': 'mrh-lattafa-yara',
        'name': 'Yara (Original)',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Creamy, Soft, Tropical-Sweet',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Creamy Soft Tropical-Sweet',
        'concentration': 'Eau de Parfum',
        'priceKES': 3900,
        'originalPriceKES': 4600,
        'rating': 4.97,
        'reviewsCount': 1100,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'Yara (Original) is an iconic, creamy, soft, and tropical-sweet fragrance created for women. Opens with vibrant tropical fruit and heliotrope before settling into fluffy vanilla, marshmallow, and warm sandalwood with moderate strength that lasts around 5–8 hours.',
        'notes': {
            'top': ['Heliotrope', 'Orchid', 'Tangerine'],
            'heart': ['Gourmand Accord', 'Tropical Fruits'],
            'base': ['Vanilla', 'Sandalwood', 'Musk']
        },
        'performance': {
            'sillage': 'Moderate',
            'longevity': 'Around 5–8 hours',
            'season': 'All-Season Feminine',
            'occasion': 'Everyday Signature, Dates, Casual Chic'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 800},
            {'size': '100ml Bottle', 'priceKES': 3900, 'isDefault': True}
        ],
        'accords': ['Creamy', 'Soft', 'Tropical', 'Sweet', 'Vanilla']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.53.09.jpeg',
        'slug': 'qissa-pink',
        'id': 'mrh-qissa-pink',
        'name': 'Qissa Pink',
        'brand': 'Paris Corner',
        'subtitle': 'Eau de Parfum • Creamy Coconut, Crisp Apple & Powdered Violet',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Fruity Floral Gourmand',
        'concentration': 'Eau de Parfum',
        'priceKES': 4800,
        'originalPriceKES': 5500,
        'rating': 4.94,
        'reviewsCount': 280,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'A luxurious princess fragrance presented in a ribbed pink palace flacon. Blends exotic sweet coconut, crisp green apple, delicate violets, and spun sugar with velvety vanilla and white amber.',
        'notes': {
            'top': ['Apple', 'Coconut'],
            'heart': ['Violet', 'Jasmine', 'Floral Chords'],
            'base': ['Vanilla', 'Sugar', 'Sandalwood', 'Amber']
        },
        'performance': {
            'sillage': 'Radiant Sweet Sillage',
            'longevity': '9-10 Hours',
            'season': 'All-Season Day & Night',
            'occasion': 'Celebrations, Weddings, Daily Glamour'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1000},
            {'size': '100ml Bottle', 'priceKES': 4800, 'isDefault': True}
        ],
        'accords': ['Coconut', 'Sweet', 'Vanilla', 'Fruity', 'Powdery']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.54.18.jpeg',
        'slug': 'marshmallow-blush',
        'id': 'mrh-marshmallow-blush',
        'name': 'Marshmallow Blush',
        'brand': 'Paris Corner',
        'subtitle': 'Eau de Parfum • Fluffy, Sugary, Marshmallow-Like',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Fluffy, Sugary Gourmand',
        'concentration': 'Eau de Parfum',
        'priceKES': 4800,
        'originalPriceKES': 5500,
        'rating': 4.96,
        'reviewsCount': 320,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'Marshmallow Blush is a dreamy, fluffy, sugary, and marshmallow-like confection created for sweet-scent lovers. Features soft pink marshmallows, whipped cream, and spun sugar with moderate strength that lasts around 4–7 hours.',
        'notes': {
            'top': ['Marshmallow', 'Strawberry', 'Sugar'],
            'heart': ['Whipped Cream', 'Vanilla Orchid'],
            'base': ['Musk', 'Warm Amber', 'Caramel']
        },
        'performance': {
            'sillage': 'Moderate',
            'longevity': 'Around 4–7 hours',
            'season': 'All-Year Comfort • Sweet Scent Favorite',
            'occasion': 'Daily Wear, Sweet-Scent Lovers, Casual'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1000},
            {'size': '100ml Bottle', 'priceKES': 4800, 'isDefault': True}
        ],
        'accords': ['Marshmallow', 'Sugary', 'Fluffy', 'Sweet', 'Vanilla']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.54.54.jpeg',
        'slug': 'lattafa-mayar-pink',
        'id': 'mrh-lattafa-mayar',
        'name': 'Mayar',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Fruity, Floral, Fresh-Sweet',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Fruity Floral Fresh-Sweet',
        'concentration': 'Eau de Parfum',
        'priceKES': 4400,
        'originalPriceKES': 5200,
        'rating': 4.93,
        'reviewsCount': 490,
        'inStock': True,
        'isBestseller': True,
        'isNew': False,
        'description': 'Mayar is an irresistible fruity, floral, and fresh-sweet fragrance crafted for women. Sparkling sweet lychee and raspberry open into a radiant bouquet of white rose and peony, drying down into soft vanilla and amber with moderate strength that lasts around 5–8 hours.',
        'notes': {
            'top': ['Lychee', 'Raspberry', 'Violet Leaf'],
            'heart': ['White Rose', 'Peony', 'Jasmine'],
            'base': ['Vanilla', 'Amber', 'Musk']
        },
        'performance': {
            'sillage': 'Moderate',
            'longevity': 'Around 5–8 hours',
            'season': 'Warm Weather • Spring & Summer',
            'occasion': 'Brunch, Daily Wear, Outings'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 900},
            {'size': '100ml Bottle', 'priceKES': 4400, 'isDefault': True}
        ],
        'accords': ['Fruity', 'Floral', 'Fresh', 'Sweet', 'Rose']
    },
    {
        'file': 'WhatsApp Image 2026-10-13 at 12.55.24.jpeg',
        'slug': 'badee-al-oud-noble-blush',
        'id': 'mrh-noble-blush',
        'name': 'Noble Blush',
        'brand': 'Lattafa',
        'subtitle': 'Eau de Parfum • Creamy, Sweet, Powdery',
        'gender': 'Women',
        'category': 'Women',
        'family': 'Creamy Sweet Powdery',
        'concentration': 'Eau de Parfum',
        'priceKES': 5400,
        'originalPriceKES': 6200,
        'rating': 4.96,
        'reviewsCount': 260,
        'inStock': True,
        'isBestseller': True,
        'isNew': True,
        'description': 'Noble Blush is an irresistibly creamy, sweet, and powdery fragrance crafted for women. Featuring comforting rose milk, whipped meringue, delicate almond, and cozy vanilla, it offers moderate projection that lasts around 4–7 hours for everyday elegance.',
        'notes': {
            'top': ['Rose Milk', 'Almond', 'Sugar Crystals'],
            'heart': ['Meringue', 'Turkish Rose', 'Powdery Notes'],
            'base': ['Vanilla', 'Sandalwood', 'White Musk']
        },
        'performance': {
            'sillage': 'Moderate',
            'longevity': 'Around 4–7 hours',
            'season': 'Daily Wear • All-Season Feminine',
            'occasion': 'Daily Wear, Brunch, Date Night'
        },
        'sizes': [
            {'size': '10ml Decant', 'priceKES': 1150},
            {'size': '100ml Bottle', 'priceKES': 5400, 'isDefault': True}
        ],
        'accords': ['Creamy', 'Sweet', 'Powdery', 'Rose', 'Vanilla', 'Almond']
    }
]

def crop_and_upscale(in_path, out_path, target_size=(1200, 1200)):
    with Image.open(in_path) as img:
        arr = np.array(img.convert('RGB'))
        h, w, _ = arr.shape
        
        row_mean = arr.mean(axis=(1, 2))
        row_max = arr.max(axis=(1, 2))
        
        valid_y = []
        for y in range(85, h - 35):
            if row_mean[y] > 12 or row_max[y] > 40:
                valid_y.append(y)
                
        if not valid_y:
            for y in range(h):
                if row_mean[y] > 12:
                    valid_y.append(y)
                    
        y_min = valid_y[0] if valid_y else 0
        y_max = valid_y[-1] if valid_y else h - 1
        
        cropped = img.crop((0, y_min, w, y_max + 1))
        cw, ch = cropped.size
        
        if cw != ch:
            dim = max(cw, ch)
            c_arr = np.array(cropped.convert('RGB'))
            bg_color = tuple([int(c) for c in c_arr[0, 0]])
            sq_img = Image.new('RGB', (dim, dim), bg_color)
            sq_img.paste(cropped, ((dim - cw) // 2, (dim - ch) // 2))
            cropped = sq_img
            
        upscaled = cropped.resize(target_size, Image.Resampling.LANCZOS)
        
        sharp_enhancer = ImageEnhance.Sharpness(upscaled)
        crisp = sharp_enhancer.enhance(1.18)
        
        contrast_enhancer = ImageEnhance.Contrast(crisp)
        final_img = contrast_enhancer.enhance(1.03)
        
        final_img.save(out_path, format='JPEG', quality=95, optimize=True)
        print(f'Processed {os.path.basename(out_path)} ({final_img.size})')

for p in products:
    in_file = os.path.join(SRC_FOLDER, p['file'])
    out_file = os.path.join(OUT_FOLDER, f"{p['slug']}.jpg")
    crop_and_upscale(in_file, out_file)
    p['image'] = f"/images/products/{p['slug']}.jpg"
    p['vendorId'] = 'maureh-vault'
    p['vendorName'] = 'Maureh Flagship Vault'
    del p['file']

js_code = 'export const PERFUMES = ' + json.dumps(products, indent=2) + ';\n'
with open(r'src\data\perfumes.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print('Done: all 22 products processed and src/data/perfumes.js generated!')
