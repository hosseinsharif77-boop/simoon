// ================================= JAVASCRIPT FILE =================================
// File: js/data.js
// Description: Static data for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// حذف allMenuItems چون از سرور دریافت می‌شود

// ================================= CATEGORY DATA =================================
/**
 * @description Descriptions for each main menu category.
 * The key is the category slug (e.g., 'pizza'), and the value is an object containing the description.
 * @type {Object<string, Object>}
 */
export const categoryData = {
    specials: { 
        description: "Experience the extraordinary with our chef's exclusive specials—masterfully crafted dishes bursting with premium ingredients and bold, unforgettable flavors. Perfect for those craving a culinary adventure unlike any other."
    },
    pizza: { 
        description: "Indulge in our authentic pizzas, from classic pepperoni to gourmet Italian creations, all made with the freshest ingredients and baked to perfection."
    },
    sandwich: { 
        description: "Dive into our gourmet sandwiches, where artisan breads meet vibrant, fresh fillings—juicy meats, crisp veggies, and signature sauces—all layered to create the perfect bite that's both satisfying and unforgettable."
    },
    'fried-chicken': { 
        description: "Indulge in our golden, crispy fried chicken—seasoned with a secret blend of spices and cooked to juicy perfection. Every crunchy bite delivers comfort, flavor, and pure satisfaction that keeps you coming back for more."
    },
    pasta: { 
        description: "Treat yourself to our authentic pasta creations, crafted with fresh ingredients and timeless Italian recipes. From velvety sauces to perfectly al dente noodles, each dish is a celebration of rich, irresistible flavors."
    },
    breakfast: { 
        description: "Kickstart your day with our vibrant breakfast selection—fluffy pancakes, farm-fresh eggs, crispy bacon, and wholesome sides—all designed to energize your morning with deliciousness and warmth."
    },
    'kids-menu': { 
        description: "Delight your little ones with our fun and flavorful kids' menu—nutritious, colorful, and crafted to spark joy with every bite. Perfectly balanced meals that kids love and parents trust."
    },
    drinks: { 
        description: "Refresh and rejuvenate with our curated selection of drinks—from freshly squeezed juices and creamy smoothies to handcrafted cocktails. The perfect sip to complement any meal or moment."
    }
};
// ========================== END OF CATEGORY DATA ==========================


// ================================= SPECIALS ALBUM DATA =================================
/**
 * @description Data for the specials carousel on the menu page.
 * Each object represents a slide with an image, title, and description.
 * @type {Array<Object>}
 */
export const specialsAlbumData = [
    {
        imageUrl: '1764022176699-019ab7e9-d8ee-7291-a84f-60cc45c957ac.png',
        title: 'Simoon Special Burger',
        description: 'Two juicy patties, melted cheese, and all the flavor you crave!'
    },
    {
        imageUrl: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        title: 'Chocolate Lava Cake',
        description: 'Decadent chocolate cake with a warm, gooey center.'
    },
    {
        imageUrl: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        title: 'Lobster Roll',
        description: 'Tender lobster meat served in a toasted brioche bun.'
    },
    {
        imageUrl: 'https://images.pexels.com/photos/1059907/pexels-photo-1059907.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        title: 'Fresh Ingredients',
        description: 'We use only the finest and freshest ingredients in our kitchen.'
    }
];
// ========================== END OF SPECIALS ALBUM DATA ==========================
// ============================== END OF JAVASCRIPT FILE ==============================