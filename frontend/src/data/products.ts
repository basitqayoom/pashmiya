export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  colors: string[];
  sizes: string[];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic Pashmina Shawl',
    price: 450,
    description: 'Timeless elegance in pure Cashmere. This hand-woven Pashmina shawl features the finest quality fibers from the highlands of Kashmir, offering unparalleled softness and warmth. A versatile accessory that elevates any ensemble.',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80',
    category: 'Classic',
    colors: ['Camel', 'Grey', 'Black'],
    sizes: ['Standard', 'Large']
  },
  {
    id: '2',
    name: 'Embroidered Floral Shawl',
    price: 680,
    description: 'A masterpiece of Kashmiri craftsmanship featuring intricate floral embroidery done entirely by hand. Each motif tells a story of centuries-old traditions passed down through generations of master artisans.',
    image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80',
    category: 'Embroidered',
    colors: ['Burgundy', 'Navy', 'Forest Green'],
    sizes: ['Standard', 'Large']
  },
  {
    id: '3',
    name: 'Solid Cashmere Wrap',
    price: 380,
    description: 'Minimalist luxury in its purest form. This sumptuously soft cashmere wrap is perfect for the discerning minimalists who appreciate understated elegance and exceptional quality.',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
    category: 'Classic',
    colors: ['Ivory', 'Charcoal', 'Camel'],
    sizes: ['Standard', 'Large']
  },
  {
    id: '4',
    name: 'Hand-Painted Landscape Shawl',
    price: 890,
    description: 'A wearable work of art. Each shawl features breathtaking hand-painted landscapes inspired by the serene beauty of Kashmir\'s valleys and mountains. A unique piece that showcases extraordinary artistic talent.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    category: 'Artisan',
    colors: ['Blue', 'Green', 'Multicolor'],
    sizes: ['Standard', 'Large']
  },
  {
    id: '5',
    name: 'Striped Silk-Pashmina',
    price: 520,
    description: 'The perfect blend of silk luster and Pashmina softness. This elegantly striped shawl combines traditional weaving techniques with contemporary design, creating a sophisticated accessory for modern women.',
    image: 'https://images.unsplash.com/photo-1606293926075-69a00febf280?w=800&q=80',
    category: 'Contemporary',
    colors: ['Rose', 'Silver', 'Gold'],
    sizes: ['Standard', 'Large']
  },
  {
    id: '6',
    name: 'Jamawar Traditional Shawl',
    price: 750,
    description: 'The crown jewel of Kashmiri textiles. Jamawar features intricate patterns woven directly into the fabric, requiring exceptional skill and months of meticulous work. A heritage piece that becomes a family treasure.',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
    category: 'Heritage',
    colors: ['Royal Blue', 'Maroon', 'Black'],
    sizes: ['Standard', 'Large']
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};
