export const categories = [
    { id: '1', name: 'Headphones', icon: 'headset-outline' },
    { id: '2', name: 'Smartwatches', icon: 'watch-outline' },
    { id: '3', name: 'Laptops', icon: 'laptop-outline' },
    { id: '4', name: 'Smartphones', icon: 'phone-portrait-outline' },
];

export const products = [
    // Headphones
    {
        id: '1',
        name: 'Sony WH-1000XM4',
        category: 'Headphones',
        price: 349.99,
        originalPrice: 399.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        description: 'Industry-leading noise canceling with Dual Noise Sensor technology',
        specifications: {
            battery: '30 hours',
            connectivity: 'Bluetooth 5.0',
            weight: '254g',
            features: ['Noise Canceling', 'Touch Controls', 'Quick Charge']
        },
        rating: 4.8,
        reviewCount: 1247,
        inStock: true,
        brand: 'Sony'
    },
    {
        id: '2',
        name: 'Bose QuietComfort 35 II',
        category: 'Headphones',
        price: 299.99,
        originalPrice: 329.99,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
        description: 'World-class noise cancellation for better sound',
        specifications: {
            battery: '20 hours',
            connectivity: 'Bluetooth 4.1',
            weight: '235g',
            features: ['Google Assistant', 'Noise Canceling', 'Wired Option']
        },
        rating: 4.6,
        reviewCount: 892,
        inStock: true,
        brand: 'Bose'
    },

    // Smartwatches
    {
        id: '3',
        name: 'Apple Watch Series 8',
        category: 'Smartwatches',
        price: 399.99,
        originalPrice: 429.99,
        image: 'https://images.unsplash.com/photo-1579586337278-3f436266e8c2?w=500',
        description: 'Advanced health monitoring and fitness tracking',
        specifications: {
            display: 'Always-On Retina',
            battery: '18 hours',
            connectivity: 'GPS + Cellular',
            features: ['ECG', 'Blood Oxygen', 'Water Resistant']
        },
        rating: 4.7,
        reviewCount: 1563,
        inStock: true,
        brand: 'Apple'
    },
    {
        id: '4',
        name: 'Samsung Galaxy Watch 5',
        category: 'Smartwatches',
        price: 279.99,
        originalPrice: 299.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        description: 'Premium health monitoring with sapphire crystal glass',
        specifications: {
            display: 'Super AMOLED',
            battery: '50 hours',
            connectivity: 'Bluetooth',
            features: ['Body Composition', 'Sleep Coaching', 'GPS']
        },
        rating: 4.5,
        reviewCount: 734,
        inStock: true,
        brand: 'Samsung'
    },

    // Laptops
    {
        id: '5',
        name: 'MacBook Pro 14"',
        category: 'Laptops',
        price: 1999.99,
        originalPrice: 2199.99,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        description: 'Supercharged by M2 Pro and M2 Max chips',
        specifications: {
            processor: 'Apple M2 Pro',
            memory: '16GB',
            storage: '512GB SSD',
            display: '14.2-inch Liquid Retina XDR'
        },
        rating: 4.9,
        reviewCount: 892,
        inStock: true,
        brand: 'Apple'
    },
    {
        id: '6',
        name: 'Dell XPS 13',
        category: 'Laptops',
        price: 999.99,
        originalPrice: 1199.99,
        image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500',
        description: 'InfinityEdge display and premium design',
        specifications: {
            processor: 'Intel Core i7',
            memory: '16GB',
            storage: '512GB SSD',
            display: '13.4-inch FHD+'
        },
        rating: 4.4,
        reviewCount: 567,
        inStock: true,
        brand: 'Dell'
    }
];

export const banners = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800',
        title: 'Summer Sale',
        subtitle: 'Up to 50% off on electronics'
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800',
        title: 'New Arrivals',
        subtitle: 'Latest tech gadgets'
    }
];