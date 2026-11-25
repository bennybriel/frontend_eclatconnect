import React, { useState, useEffect } from 'react';
import { Category, Location } from '../types';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { request } from '../api/client';
import { DirectoryCardsSkeleton } from '../components/SkeletonLoader';

interface HomePageProps {
  categories: Category[];
  locations: Location[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onNavigate: (page: string) => void;
  onSearch?: (searchQuery: string, catId?: string, locId?: string) => void;
  onSelectItem?: (item: any) => void;
  favorites?: Record<string, boolean>;
  onToggleFavorite?: (item: any) => void;
}

// Category helper to resolve icons
const getCategoryIcon = (categoryName: string): string => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('electr') || name.includes('gadget') || name.includes('phone') || name.includes('laptop')) return '📱';
  if (name.includes('food') || name.includes('grocer') || name.includes('eat') || name.includes('snack')) return '🍔';
  if (name.includes('fashion') || name.includes('cloth') || name.includes('tailor') || name.includes('wear') || name.includes('shoe')) return '👗';
  if (name.includes('beauty') || name.includes('hair') || name.includes('barb') || name.includes('salon')) return '✂️';
  if (name.includes('repair') || name.includes('plumb') || name.includes('carpenter') || name.includes('trade') || name.includes('artisan')) return '🛠️';
  if (name.includes('home') || name.includes('hostel') || name.includes('lodge') || name.includes('lifestyle')) return '🏠';
  if (name.includes('clean') || name.includes('laundry')) return '🧺';
  if (name.includes('transport') || name.includes('deliver') || name.includes('dispatch') || name.includes('bike')) return '🛵';
  if (name.includes('educat') || name.includes('book') || name.includes('tutor') || name.includes('stationery')) return '📚';
  if (name.includes('photo') || name.includes('media') || name.includes('video')) return '📸';
  if (name.includes('pre-owned') || name.includes('used')) return '♻️';
  if (name.includes('request')) return '📢';
  return '🏷️';
};

// Rich campus catalog items across core LAUTECH & Ogbomoso categories
const CURATED_CAMPUS_CATALOG: Record<string, any[]> = {
  'Electronics': [
    {
      id: 'cur-elec-1',
      name: 'Used HP 250 G7 Core i5 Laptop',
      kind: 'PRODUCT',
      price: 220000,
      location: 'Adenike',
      category_name: 'Electronics',
      provider_name: 'Campus Tech Hub',
      phone: '2348035424800',
      whatsapp: '2348035424800',
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80',
      description: 'Clean HP Core i5 8th Gen, 8GB RAM, 256GB SSD, 4 hours backup battery. Ideal for programming, design & student assignments.',
    },
    {
      id: 'cur-elec-2',
      name: 'Original 65W GaN Fast Charger (Type-C / USB)',
      kind: 'PRODUCT',
      price: 8500,
      location: 'Under G',
      category_name: 'Electronics',
      provider_name: 'Apex Gadgets',
      phone: '2348022334455',
      whatsapp: '2348022334455',
      image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
      description: 'Super fast laptop and phone dual-port charger with auto heat control and surge safety.',
    },
    {
      id: 'cur-elec-3',
      name: '20,000mAh Dual-Port Power Bank',
      kind: 'PRODUCT',
      price: 16500,
      location: 'Under G',
      category_name: 'Electronics',
      provider_name: 'Gadget Vault',
      phone: '2348066778899',
      whatsapp: '2348066778899',
      image_url: 'https://images.unsplash.com/photo-1609592426868-b7c126d4be04?auto=format&fit=crop&w=400&q=80',
      description: 'Reliable high-capacity power bank for nocturnal study sessions and campus lodge power outages.',
    },
    {
      id: 'cur-elec-4',
      name: 'Heavy Duty 6-Way Extension Socket',
      kind: 'PRODUCT',
      price: 5500,
      location: 'Adenike',
      category_name: 'Electronics',
      provider_name: 'Apex Gadgets',
      phone: '2348022334455',
      whatsapp: '2348022334455',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      description: 'Sturdy surge protector with copper contacts and integrated USB charging slots.',
    },
    {
      id: 'cur-elec-5',
      name: 'Laptop Screen Replacement Service',
      kind: 'SERVICE',
      price: 18000,
      isStartingPrice: true,
      location: 'Under G',
      category_name: 'Electronics',
      provider_name: 'LAUTECH Tech Fix',
      phone: '2348035424800',
      whatsapp: '2348035424800',
      image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=400&q=80',
      description: 'Original IPS and HD screens for HP, Dell, Lenovo, and Acer laptops with free installation & 3 months guarantee.',
    },
    {
      id: 'cur-elec-6',
      name: 'Wireless Bluetooth Earbuds (ENC Noise Cancelling)',
      kind: 'PRODUCT',
      price: 11000,
      location: 'Aroje',
      category_name: 'Electronics',
      provider_name: 'Prime Audio Ogbomoso',
      phone: '2348123456789',
      whatsapp: '2348123456789',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
      description: 'Deep bass, clear microphone for online lectures, and 30-hour combined playback with wireless charging case.',
    },
  ],
  'Food & Groceries': [
    {
      id: 'cur-food-1',
      name: 'Jollof Rice & Crispy Chicken Combo',
      kind: 'PRODUCT',
      price: 2500,
      location: 'Under G',
      category_name: 'Food & Groceries',
      provider_name: 'Campus Kitchen Express',
      phone: '2348055667788',
      whatsapp: '2348055667788',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
      description: 'Fresh firewood party jollof rice served with spiced grilled chicken, fried plantain, and coleslaw. Fast lodge delivery.',
    },
    {
      id: 'cur-food-2',
      name: 'Jumbo Chicken & Beef Shawarma',
      kind: 'PRODUCT',
      price: 2000,
      location: 'Adenike',
      category_name: 'Food & Groceries',
      provider_name: 'Bite & Smile Grills',
      phone: '2348144556677',
      whatsapp: '2348144556677',
      image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
      description: 'Hot, cheesy double-sausage shawarma grilled fresh on order near LAUTECH Second Gate.',
    },
    {
      id: 'cur-food-3',
      name: 'Carton of Indomie Noodles (70g x 40)',
      kind: 'PRODUCT',
      price: 13500,
      location: 'General',
      category_name: 'Food & Groceries',
      provider_name: 'Grace Wholesale Provisions',
      phone: '2348077889900',
      whatsapp: '2348077889900',
      image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
      description: 'Wholesale carton of Indomie noodles. Free delivery to student lodges in Under G, Adenike, and Aroje.',
    },
    {
      id: 'cur-food-4',
      name: 'Fresh Fruit Parfait & Smoothies',
      kind: 'PRODUCT',
      price: 1800,
      location: 'Under G',
      category_name: 'Food & Groceries',
      provider_name: 'Nature Fresh Bar',
      phone: '2348188990011',
      whatsapp: '2348188990011',
      image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
      description: 'Rich Greek yogurt layered with granola, fresh strawberries, bananas, apples, and honey.',
    },
  ],
  'Fashion & Beauty': [
    {
      id: 'cur-fash-1',
      name: 'Bespoke Senator Native Wear (Tailored)',
      kind: 'SERVICE',
      price: 15000,
      isStartingPrice: true,
      location: 'Adenike',
      category_name: 'Fashion & Beauty',
      provider_name: 'Classic Stitches & Design',
      phone: '2348033445599',
      whatsapp: '2348033445599',
      image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80',
      description: 'Sharp tailoring with precise campus fittings, premium finishing, and neat geometric pocket detailing.',
    },
    {
      id: 'cur-fash-2',
      name: 'White Casual Canvas Sneakers (Unisex)',
      kind: 'PRODUCT',
      price: 14000,
      location: 'Under G',
      category_name: 'Fashion & Beauty',
      provider_name: 'Kicks & Styles Ogbomoso',
      phone: '2348166778822',
      whatsapp: '2348166778822',
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
      description: 'Comfortable, durable campus sneakers. Sizes 38 to 45 available in pristine condition.',
    },
    {
      id: 'cur-fash-3',
      name: 'Men Vintage Thrift Shirt (Clean Grade A)',
      kind: 'PRODUCT',
      price: 4500,
      location: 'Aroje',
      category_name: 'Fashion & Beauty',
      provider_name: 'Campus Thrift Box',
      phone: '2348099881122',
      whatsapp: '2348099881122',
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
      description: 'Pre-washed, ready-to-wear retro patterned oversized thrift shirts for casual campus outfits.',
    },
  ],
  'Hairdressing': [
    {
      id: 'cur-hair-1',
      name: 'Executive Haircut & Beard Grooming',
      kind: 'SERVICE',
      price: 1500,
      isStartingPrice: true,
      location: 'Under G',
      category_name: 'Hairdressing',
      provider_name: 'Fresh Cuts Executive Salon',
      phone: '2348011223344',
      whatsapp: '2348011223344',
      image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
      description: 'Precision fades, hairline correction, hair wash, aftershave treatment, and sterilised tools.',
    },
    {
      id: 'cur-hair-2',
      name: 'Knotless Braids & Box Braids Styling',
      kind: 'SERVICE',
      price: 5000,
      isStartingPrice: true,
      location: 'Adenike',
      category_name: 'Hairdressing',
      provider_name: 'Glamour Hair Studio',
      phone: '2348133445566',
      whatsapp: '2348133445566',
      image_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=400&q=80',
      description: 'Painless, light-weight knotless braids, bohemian curls, and scalp treatment near Bovas Axis.',
    },
    {
      id: 'cur-hair-3',
      name: 'Wig Revamping, Washing & Bone Straight Ironing',
      kind: 'SERVICE',
      price: 4000,
      isStartingPrice: true,
      location: 'Under G',
      category_name: 'Hairdressing',
      provider_name: 'Queens Beauty Hub',
      phone: '2348077665544',
      whatsapp: '2348077665544',
      image_url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80',
      description: 'Deep conditioning, hot comb press, closure replacement and silky finish for human hair wigs.',
    },
  ],
  'Home & Lifestyle': [
    {
      id: 'cur-home-1',
      name: 'Semi-Automatic Washing Machine (7.5kg Used)',
      kind: 'PRODUCT',
      price: 85000,
      location: 'Aroje',
      category_name: 'Home & Lifestyle',
      provider_name: 'Community Moving Sales',
      phone: '2348099887766',
      whatsapp: '2348099887766',
      image_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
      description: 'Top-loader twin tub washing machine with powerful spin dryer. 100% functional, tested and clean.',
    },
    {
      id: 'cur-home-2',
      name: 'Complete 6kg Gas Cylinder with Burner',
      kind: 'PRODUCT',
      price: 24000,
      location: 'Adenike',
      category_name: 'Home & Lifestyle',
      provider_name: 'Campus Home Essentials',
      phone: '2348066554433',
      whatsapp: '2348066554433',
      image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80',
      description: 'Brand new certified safety gas cylinder with anti-rust coat, strong iron burner grill and regulator.',
    },
    {
      id: 'cur-home-3',
      name: 'Student Reading Table & Ergonomic Study Chair',
      kind: 'PRODUCT',
      price: 19500,
      location: 'Under G',
      category_name: 'Home & Lifestyle',
      provider_name: 'Ogbomoso Woodcrafts',
      phone: '2348022114477',
      whatsapp: '2348022114477',
      image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
      description: 'Solid wooden study desk with drawer and comfortable padded mesh chair for exam preparations.',
    },
    {
      id: 'cur-home-4',
      name: 'Rechargeable Standing Fan with Solar Port',
      kind: 'PRODUCT',
      price: 28500,
      location: 'Under G',
      category_name: 'Home & Lifestyle',
      provider_name: 'Apex Gadgets',
      phone: '2348022334455',
      whatsapp: '2348022334455',
      image_url: 'https://images.unsplash.com/photo-1618944847823-149f1d8e1371?auto=format&fit=crop&w=400&q=80',
      description: '16-inch oscillating fan with 12-hour lithium battery life, LED night light, and USB mobile charger.',
    },
  ],
  'Electrical': [
    {
      id: 'cur-elec-serv-1',
      name: 'Hostel Wiring & Socket Installation',
      kind: 'SERVICE',
      price: 4000,
      isStartingPrice: true,
      location: 'Under G',
      category_name: 'Electrical',
      provider_name: 'Segun Electricals & Repairs',
      phone: '2348123456789',
      whatsapp: '2348123456789',
      image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
      description: 'Certified electrical technician for lodge wiring, circuit breaker fixes, changeover switch and fan mounting.',
    },
    {
      id: 'cur-elec-serv-2',
      name: 'Generator Servicing & Carburetor Tuning',
      kind: 'SERVICE',
      price: 3500,
      isStartingPrice: true,
      location: 'Adenike',
      category_name: 'Electrical',
      provider_name: 'Alaba Gen Clinic',
      phone: '2348044332211',
      whatsapp: '2348044332211',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      description: 'On-site generator repairs, coil rewinding, engine oil change, and carburetor tuning for hostels.',
    },
  ],
  'Laundry': [
    {
      id: 'cur-laun-1',
      name: 'Full Student Weekly Laundry Basket (Wash & Iron)',
      kind: 'SERVICE',
      price: 3000,
      location: 'Adenike',
      category_name: 'Laundry',
      provider_name: 'FastTrack Laundry & Dry Cleaners',
      phone: '2348022334488',
      whatsapp: '2348022334488',
      image_url: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=400&q=80',
      description: 'Wash, dry, fabric softener, and crisp steam press for up to 25 clothing items. Pick-up & drop-off available.',
    },
  ],
};

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  locations,
  selectedCategory,
  onSelectCategory,
  onNavigate,
  onSearch,
  onSelectItem,
  favorites = {},
  onToggleFavorite,
}) => {
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCategory, setHeroCategory] = useState(selectedCategory || '');
  const [heroLocation, setHeroLocation] = useState('');

  // Live database uploaded listings from all endpoints
  const [uploadedItems, setUploadedItems] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      request<any[]>('/public/listings').catch(() => []),
      request<any[]>('/public/requests').catch(() => []),
      request<any[]>('/public/providers').catch(() => []),
    ]).then(([listingsData, requestsData, providersData]) => {
      if (!isMounted) return;

      // 1. Normalized Listings (Products, Services, Projects uploaded by Vendors & Artisans)
      const normalizedListings = (Array.isArray(listingsData) ? listingsData : []).map(item => ({
        id: item.id,
        name: item.name || item.title,
        kind: item.kind || 'PRODUCT',
        price: item.price ?? 0,
        location: item.location_area || item.location || 'Ogbomoso',
        category_name: item.category_name || item.category || item.custom_category || 'General',
        category_id: item.category_id,
        provider_name: item.provider_name || item.name,
        phone: item.phone,
        whatsapp: item.whatsapp || item.phone,
        image_url: item.image_url || (item.images ? item.images.split(',')[0].trim() : null),
        images: item.images,
        description: item.description,
        availability_status: item.availability_status || 'AVAILABLE',
        is_uploaded: true,
      }));

      // 2. Normalized Requests & Pre-owned Sales uploaded by Users
      const normalizedRequests = (Array.isArray(requestsData) ? requestsData : []).map(req => ({
        id: req.id,
        name: req.title || req.name,
        kind: req.request_type === 'PREOWNED_SALE' ? 'PREOWNED_SALE' : (req.request_type || 'REQUEST'),
        price: req.budget ?? 0,
        location: req.location_area || req.location || 'Ogbomoso',
        category_name: req.category || req.category_name || req.custom_category || (req.request_type === 'PREOWNED_SALE' ? 'Pre-owned Items' : 'Customer Requests'),
        category_id: req.category_id,
        provider_name: req.provider_name || (req.request_type === 'PREOWNED_SALE' ? 'Student / Resident Seller' : 'Campus Customer'),
        phone: req.phone,
        whatsapp: req.whatsapp || req.phone,
        image_url: req.image_url || (req.images ? req.images.split(',')[0].trim() : null),
        images: req.images,
        description: req.description,
        availability_status: req.availability_status || 'AVAILABLE',
        is_uploaded: true,
      }));

      // 3. Normalized Businesses & Artisans Profiles uploaded
      const normalizedProviders = (Array.isArray(providersData) ? providersData : []).map(prov => ({
        id: prov.id,
        name: prov.name,
        kind: prov.type === 'PROFESSIONAL' ? 'ARTISAN' : 'BUSINESS',
        price: null,
        location: prov.location_area || prov.location || 'Ogbomoso',
        category_name: prov.category || prov.category_name || prov.custom_category || (prov.type === 'PROFESSIONAL' ? 'Campus Artisans' : 'Campus Businesses'),
        category_id: prov.category_id,
        provider_name: prov.name,
        phone: prov.phone,
        whatsapp: prov.whatsapp || prov.phone,
        image_url: prov.image_url,
        description: prov.description,
        availability_status: 'AVAILABLE',
        is_uploaded: true,
        type: prov.type,
      }));

      // Combine all uploaded items together without omitting any item
      const allUploaded = [...normalizedListings, ...normalizedRequests, ...normalizedProviders];
      setUploadedItems(allUploaded);
      setLoadingListings(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(heroSearch.trim(), heroCategory || undefined, heroLocation || undefined);
    }
    onNavigate('Products');
  };

  const handleHeartClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(item);
    }
  };

  const handleViewMoreCategory = (cat: { id?: string; name: string; target_type?: string }) => {
    if (cat.id && !cat.id.startsWith('custom-') && !cat.id.startsWith('cur-')) {
      onSelectCategory(cat.id);
      if (onSearch) {
        onSearch('', cat.id, undefined);
      }
    } else if (onSearch) {
      onSearch(cat.name, undefined, undefined);
    }

    const pageTarget =
      cat.target_type === 'ARTISAN' || cat.name === 'Campus Artisans'
        ? 'Artisans'
        : cat.target_type === 'SERVICE'
        ? 'Services'
        : cat.target_type === 'BUSINESS' || cat.name === 'Campus Businesses'
        ? 'Businesses'
        : cat.name === 'Pre-owned Items'
        ? 'Pre-owned'
        : cat.name === 'Customer Requests'
        ? 'Requests'
        : 'Products';

    onNavigate(pageTarget);
  };

  // 6 Quick Access Feature Cards matching design
  const featureCards = [
    {
      id: 'businesses',
      title: 'Businesses',
      desc: 'Shops, stores & local brands',
      icon: '🏪',
      target: 'Businesses',
    },
    {
      id: 'products',
      title: 'Products',
      desc: 'New items for sale',
      icon: '🛍️',
      target: 'Products',
    },
    {
      id: 'artisans',
      title: 'Artisans',
      desc: 'Skilled & handwork professionals',
      icon: '✂️',
      target: 'Artisans',
    },
    {
      id: 'services',
      title: 'Services',
      desc: 'Laundry, delivery, repairs & more',
      icon: '🔧',
      target: 'Services',
    },
    {
      id: 'preowned',
      title: 'Pre-owned',
      desc: 'Buy & sell used items',
      icon: '♻️',
      target: 'Pre-owned',
    },
    {
      id: 'requests',
      title: 'Requests',
      desc: 'Post what you need & get offers',
      icon: '💬',
      target: 'Requests',
    },
  ];

  // =========================================================================
  // BUILD CATEGORY BY CATEGORY SHOWCASE (UP TO 10 ITEMS PER CATEGORY)
  // Ensures ALL uploaded items are displayed with fast page load performance
  // =========================================================================
  const categorySections = React.useMemo(() => {
    // Group Map: Map<normalizedCategoryName, CategoryGroup>
    const groupMap = new Map<string, {
      id: string;
      name: string;
      icon: string;
      target_type?: string;
      items: any[];
    }>();

    // 1. Initialize registered database categories
    categories.forEach(cat => {
      if (!cat.name || cat.name.toLowerCase() === 'others') return;
      const key = cat.name.trim().toLowerCase();
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: cat.id,
          name: cat.name.trim(),
          icon: getCategoryIcon(cat.name),
          target_type: cat.target_type,
          items: [],
        });
      }
    });

    // 2. Add EVERY SINGLE uploaded item to its matching category or dynamically create a category section
    uploadedItems.forEach(item => {
      const rawCatName = (item.category_name || item.category || item.custom_category || '').trim();
      const normCatName = rawCatName ? rawCatName.toLowerCase() : 'other campus listings';

      // Look up by category_id first
      let matchedGroup = item.category_id
        ? Array.from(groupMap.values()).find(g => g.id === item.category_id)
        : undefined;

      // Or look up by normalized category name
      if (!matchedGroup && groupMap.has(normCatName)) {
        matchedGroup = groupMap.get(normCatName);
      }

      // If category doesn't exist yet (e.g. custom category like "Solar", "Jewelry", "Phone Cases"), create it!
      if (!matchedGroup) {
        const displayName = rawCatName || 'Other Campus Listings';
        const newGroup = {
          id: item.category_id || `custom-${normCatName.replace(/[^a-z0-9]/g, '-')}`,
          name: displayName,
          icon: getCategoryIcon(displayName),
          target_type: item.kind === 'SERVICE' ? 'SERVICE' : item.kind === 'ARTISAN' ? 'ARTISAN' : 'PRODUCT',
          items: [],
        };
        groupMap.set(normCatName, newGroup);
        matchedGroup = newGroup;
      }

      // Add uploaded item to the category
      matchedGroup.items.push(item);
    });

    // 3. For any standard categories that have curated samples, augment them so they look rich (avoiding duplicates)
    for (const [curatedCatName, sampleList] of Object.entries(CURATED_CAMPUS_CATALOG)) {
      const normCurated = curatedCatName.toLowerCase();
      let targetGroup = groupMap.get(normCurated);

      if (!targetGroup) {
        targetGroup = Array.from(groupMap.values()).find(g =>
          g.name.toLowerCase().includes(normCurated) || normCurated.includes(g.name.toLowerCase())
        );
      }

      if (targetGroup) {
        sampleList.forEach(sample => {
          if (!targetGroup!.items.some(it => it.id === sample.id || it.name === sample.name)) {
            targetGroup!.items.push(sample);
          }
        });
      } else {
        groupMap.set(normCurated, {
          id: `cur-${normCurated.replace(/[^a-z0-9]/g, '-')}`,
          name: curatedCatName,
          icon: getCategoryIcon(curatedCatName),
          items: [...sampleList],
        });
      }
    }

    // 4. Return all groups with categories having real uploaded items sorted to the top!
    return Array.from(groupMap.values())
      .filter(g => g.items.length > 0)
      .sort((a, b) => {
        const aUploadedCount = a.items.filter(it => it.is_uploaded).length;
        const bUploadedCount = b.items.filter(it => it.is_uploaded).length;
        if (bUploadedCount !== aUploadedCount) {
          return bUploadedCount - aUploadedCount; // Categories with real uploads come first!
        }
        return a.name.localeCompare(b.name);
      });
  }, [categories, uploadedItems]);

  return (
    <div className="home-container">
      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH EMBEDDED SEARCH & STUDENT HERO GRAPHIC */}
      {/* ========================================================= */}
      <section className="eclat-hero-section">
        <div className="hero-content-col">
          {/* Pill Badge */}
          <div className="hero-pill-badge">
            LAUTECH · OGBOMOSO LOCAL MARKETPLACE
          </div>

          {/* Bold Headline */}
          <h1 className="hero-headline">
            Buy, sell, hire services, and connect with skilled professionals.
          </h1>

          {/* Subtitle */}
          <p className="hero-lead">
            Discover local businesses, products, artisans, services and pre-owned items across LAUTECH and the wider Ogbomoso community. Connect directly via call or WhatsApp. No checkout or payment fees.
          </p>

          {/* Embedded Floating Search Bar */}
          <form className="hero-search-bar" onSubmit={handleHeroSubmit}>
            <div className="search-field search-text-field">
              <span className="search-field-icon">🔍</span>
              <input
                type="text"
                placeholder="Search for businesses, products, services or items..."
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
              />
            </div>

            <div className="search-divider-v" />

            <div className="search-field search-select-field">
              <span className="search-field-icon">📁</span>
              <select
                value={heroCategory}
                onChange={e => {
                  setHeroCategory(e.target.value);
                  onSelectCategory(e.target.value);
                }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-divider-v" />

            <div className="search-field search-select-field">
              <span className="search-field-icon">📍</span>
              <select
                value={heroLocation}
                onChange={e => setHeroLocation(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.area}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="hero-search-btn">
              Search
            </button>
          </form>
        </div>

        {/* Right Student Hero Graphic (Desktop & Mobile View) */}
        <div className="hero-graphic-col">
          <div className="hero-graphic-frame">
            <img
              src="/hero-student.png?v=20261123b"
              alt="LAUTECH Student exploring Eclat Connect"
              className="hero-graphic-img"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. 6 QUICK-ACCESS FEATURE CARDS (DESKTOP & MOBILE)        */}
      {/* ========================================================= */}
      <section className="feature-cards-grid">
        {featureCards.map(card => (
          <div
            key={card.id}
            className="feature-card"
            onClick={() => onNavigate(card.target)}
            role="button"
            tabIndex={0}
          >
            <div className="feature-card-icon">{card.icon}</div>
            <div className="feature-card-title">{card.title}</div>
            <div className="feature-card-desc">{card.desc}</div>
          </div>
        ))}
      </section>

      {/* Mobile-Only Big CTA Button: "Post What I Need" */}
      <div className="mobile-prominent-cta">
        <button
          className="btn-lime mobile-post-need-btn"
          onClick={() => onNavigate('Post What I Need')}
        >
          Post What I Need →
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. CATEGORY QUICK-NAV JUMP BAR                            */}
      {/* ========================================================= */}
      {categorySections.length > 0 && (
        <div className="category-quick-nav-bar">
          {categorySections.map(cat => (
            <button
              key={cat.id}
              type="button"
              className="category-quick-pill"
              onClick={() => {
                const el = document.getElementById(`category-sec-${cat.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  handleViewMoreCategory(cat);
                }
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 10 }}>
                {cat.items.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loadingListings && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-purple)' }}>
              Loading campus categories & listings...
            </span>
          </div>
          <DirectoryCardsSkeleton count={6} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CATEGORY BY CATEGORY SHOWCASE (UP TO 10 ITEMS EACH)   */}
      {/* All uploaded items displayed, limited to 10 for fast loading */}
      {/* ========================================================= */}
      {!loadingListings && categorySections.map(cat => {
        // Limit to at most 10 items per category for ultra-fast page load!
        const displayedItems = cat.items.slice(0, 10);
        const hasMoreThan10 = cat.items.length > 10;

        return (
          <section
            key={cat.id}
            id={`category-sec-${cat.id}`}
            className="category-showcase-section"
          >
            {/* Section Header Row with Category Name, Count & "View more →" */}
            <div className="section-header-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <span>{cat.icon}</span> {cat.name}
                  </h2>
                  <span
                    className="card-badge"
                    style={{ background: '#f3e8ff', color: 'var(--brand-purple)', fontWeight: 700, fontSize: 11 }}
                  >
                    {cat.items.length} {cat.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Discover approved listings, deals, and service providers for {cat.name.toLowerCase()} near LAUTECH.
                </p>
              </div>

              {/* View More Link in Header */}
              <button
                type="button"
                className="view-more-link"
                onClick={() => handleViewMoreCategory(cat)}
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                View more ({cat.items.length}) →
              </button>
            </div>

            {/* Grid of up to 20 Items */}
            <div className="category-listings-grid">
              {displayedItems.map(item => {
                const isFav = !!favorites[item.id];
                const displayImg =
                  item.image_url ||
                  (item.images ? item.images.split(',')[0].trim() : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80');

                return (
                  <article
                    key={item.id}
                    className="popular-card"
                    onClick={() => onSelectItem && onSelectItem(item)}
                  >
                    <div className="popular-card-media">
                      <img src={displayImg} alt={item.name} loading="lazy" />
                      <button
                        type="button"
                        className={`fav-heart-btn ${isFav ? 'active' : ''}`}
                        onClick={e => handleHeartClick(e, item)}
                        title="Save listing to favorites"
                        aria-label="Save listing to favorites"
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <div className="popular-card-body">
                      <h3 className="popular-card-title" title={item.name}>
                        {item.name}
                      </h3>

                      {item.price !== null && (
                        <div className="popular-card-price">
                          {item.isStartingPrice ? 'From ' : ''}
                          ₦{Number(item.price || item.budget || 0).toLocaleString()}
                        </div>
                      )}

                      <div className="popular-card-location">
                        <span>📍</span> {item.location_area || item.location || 'Ogbomoso'}
                      </div>

                      {item.provider_name && (
                        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4, fontWeight: 600 }}>
                          🏪 {item.provider_name}
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                        <DirectContactButtons
                          phone={item.phone}
                          whatsapp={item.whatsapp}
                          listingTitle={item.name}
                          size="sm"
                        />
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* 11th Card shown if category has more than 10 items */}
              {hasMoreThan10 && (
                <div
                  className="popular-card category-more-card"
                  onClick={() => handleViewMoreCategory(cat)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon || '🔍'}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand-purple)', marginBottom: 4 }}>
                      +{cat.items.length - 10} More Items
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
                      Explore all {cat.items.length} listings in {cat.name}
                    </p>
                    <span className="btn-outline btn-sm" style={{ fontWeight: 700, borderColor: 'var(--brand-purple)', color: 'var(--brand-purple)' }}>
                      View All →
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom "View More in Category" Action Link */}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 700,
                  borderColor: 'var(--border)',
                  color: 'var(--brand-purple)',
                  padding: '8px 18px',
                  borderRadius: 20,
                }}
                onClick={() => handleViewMoreCategory(cat)}
              >
                <span>Browse all {cat.name} ({cat.items.length} items)</span>
                <span>→</span>
              </button>
            </div>
          </section>
        );
      })}

      {/* Prominent Desktop "Post What I Need" Banner Card */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            border: '2px dashed #c084fc',
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: 800,
            margin: '0 auto',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📢</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-purple)', margin: '0 0 8px' }}>
            Looking for something specific that is not listed?
          </h3>
          <p style={{ fontSize: 14.5, color: '#4b5563', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.55 }}>
            Tell sellers, students, and campus artisans what you need! Post a free request and verified providers will send you direct quotes on WhatsApp & SMS.
          </p>
          <button
            type="button"
            className="btn-lime"
            style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
            onClick={() => onNavigate('Post What I Need')}
          >
            📢 Post What I Need →
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. HOW ECLAT CONNECT WORKS (3-STEP DIRECT DEALING)        */}
      {/* ========================================================= */}
      <section className="how-it-works-panel">
        <h2 className="how-it-works-title">
          How ECLAT <span style={{ color: 'var(--brand-purple)' }}>CONNECT</span> Works
        </h2>

        <div className="steps-workflow-row">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-badge">1</div>
            <div className="step-content">
              <h4 className="step-heading">Discover</h4>
              <p className="step-text">Find businesses, products, services and used items.</p>
            </div>
          </div>

          <div className="step-arrow-divider">→</div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-badge">2</div>
            <div className="step-content">
              <h4 className="step-heading">Connect</h4>
              <p className="step-text">Contact approved providers via call or WhatsApp.</p>
            </div>
          </div>

          <div className="step-arrow-divider">→</div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-badge">3</div>
            <div className="step-content">
              <h4 className="step-heading">Deal Directly</h4>
              <p className="step-text">Agree on price and service details with the provider.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. KEY HIGHLIGHTS BANNER (BOTTOM OF HOMEPAGE)             */}
      {/* ========================================================= */}
      <section className="key-highlights-bar">
        <div className="highlight-tag">
          <span className="hl-icon">📱</span> Mobile-friendly navigation
        </div>
        <div className="highlight-tag">
          <span className="hl-icon">♻️</span> Integrated Pre-owned items
        </div>
        <div className="highlight-tag">
          <span className="hl-icon">🛡️</span> Better privacy & request control
        </div>
        <div className="highlight-tag">
          <span className="hl-icon">🟢</span> Clear provider approval & verification
        </div>
        <div className="highlight-tag">
          <span className="hl-icon">🔍</span> Prominent search & filters
        </div>
        <div className="highlight-tag">
          <span className="hl-icon">⚡</span> Cleaner, consistent branding & layout
        </div>
      </section>
    </div>
  );
};
