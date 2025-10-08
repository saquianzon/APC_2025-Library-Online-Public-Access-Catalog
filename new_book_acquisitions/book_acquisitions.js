// Configuration
const API_BASE = 'https://library.apc.edu.ph/cgi-bin/koha';
const PLACEHOLDER_COVER = 'https://via.placeholder.com/160x240/334290/ffffff?text=No+Cover';


// Data Storage
const booksData = {
    gs: [],
    hs: [],
    faculty: []
};

const carouselState = {
    gs: { currentIndex: 0, interval: null },
    hs: { currentIndex: 0, interval: null },
    faculty: { currentIndex: 0, interval: null }
};


// Fetch Books
async function fetchNewAcquisitions(section) {
    try {
        // Map sections to collection codes or search terms (future use)
        const searchQueries = {
            gs: 'collection:GRADESCHOOL OR audience:Juvenile',
            hs: 'collection:HIGHSCHOOL OR audience:Young%20Adult',
            faculty: 'collection:FACULTY OR audience:Adult'
        };

        const currentYear = new Date().getFullYear();

        // RSS feed search (OPAC search)
        const opacSearchUrl = `${API_BASE}/opac-search.pl?idx=&q=&do=Search&limit=yr,st-numeric:${currentYear}&sort_by=acqdate_dsc&format=rss`;

        const response = await fetch(opacSearchUrl);
        if (!response.ok) throw new Error('Failed to fetch books');

        const text = await response.text();
        return parseRSSFeed(text, section);

    } catch (error) {
        console.error(`Error fetching ${section} books:`, error);
        return generateFallbackData(section);
    }
}

// Parse RSS Feed
function parseRSSFeed(rssText, section) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');

    const books = [];
    const maxBooks = 10;

    for (let i = 0; i < Math.min(items.length, maxBooks); i++) {
        const item = items[i];

        const title = item.getElementsByTagName('title')[0]?.textContent || 'Unknown Title';
        const description = item.getElementsByTagName('description')[0]?.textContent || '';
        const link = item.getElementsByTagName('link')[0]?.textContent || '';

        // Extract biblionumber
        const biblioMatch = link.match(/biblionumber=(\d+)/);
        const biblionumber = biblioMatch ? biblioMatch[1] : null;

        // Extract author and year
        const authorMatch = description.match(/by ([^<]+)/);
        const yearMatch = description.match(/(\d{4})/);

        books.push({
            title: cleanTitle(title),
            author: authorMatch ? authorMatch[1].trim() : 'Unknown Author',
            year: yearMatch ? yearMatch[1] : new Date().getFullYear().toString(),
            cover: biblionumber
                ? `${API_BASE}/opac-image.pl?biblionumber=${biblionumber}`
                : PLACEHOLDER_COVER,
            biblionumber
        });
    }

    return books.length > 0 ? books : generateFallbackData(section);
}

// Helpers
function cleanTitle(title) {
    return title
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);
}

function generateFallbackData(section) {
    const sectionTitles = {
        gs: [
            { title: 'The Magic Tree House', author: 'Mary Pope Osborne' },
            { title: 'Wonder', author: 'R.J. Palacio' },
            { title: "Charlotte's Web", author: 'E.B. White' },
            { title: 'Matilda', author: 'Roald Dahl' },
            { title: 'The Chronicles of Narnia', author: 'C.S. Lewis' }
        ],
        hs: [
            { title: 'To Kill a Mockingbird', author: 'Harper Lee' },
            { title: '1984', author: 'George Orwell' },
            { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
            { title: 'Lord of the Flies', author: 'William Golding' },
            { title: 'The Hunger Games', author: 'Suzanne Collins' }
        ],
        faculty: [
            { title: 'Educational Psychology', author: 'John W. Santrock' },
            { title: 'Teaching Strategies', author: 'Donald C. Orlich' },
            { title: 'Curriculum Development', author: 'Allan C. Ornstein' },
            { title: 'Assessment in Education', author: 'Robert J. Marzano' },
            { title: 'Digital Teaching Methods', author: 'Marc Prensky' }
        ]
    };

    const currentYear = new Date().getFullYear();

    return sectionTitles[section].map((book, index) => ({
        ...book,
        year: currentYear.toString(),
        cover: `https://picsum.photos/160/240?random=${section}${index}`
    }));
}

// Carousel
function initCarousel(section) {
    const container = document.getElementById(`carousel-${section}`);
    const books = booksData[section];

    container.innerHTML = '';

    if (books.length === 0) {
        container.innerHTML = '<div class="error-text">No books available</div>';
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <img src="${book.cover}" 
                 alt="${book.title}" 
                 onerror="this.src='${PLACEHOLDER_COVER}'"
                 loading="lazy">
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-year">${book.year}</div>
            </div>
        `;
        container.appendChild(card);
    });

    updateCarouselPosition(section);
    startAutoRotation(section);
}

function updateCarouselPosition(section) {
    const container = document.getElementById(`carousel-${section}`);
    const cards = container.querySelectorAll('.book-card');
    const currentIndex = carouselState[section].currentIndex;
    const totalCards = cards.length;

    cards.forEach((card, index) => {
        let position = index - currentIndex;

        if (position < -Math.floor(totalCards / 2)) {
            position += totalCards;
        } else if (position > Math.floor(totalCards / 2)) {
            position -= totalCards;
        }

        const absPos = Math.abs(position);
        const translateX = position * 120;
        const translateZ = -absPos * 150;
        const rotateY = position * -25;
        const scale = 1 - (absPos * 0.15);
        const opacity = position === 0 ? 1 : 0.6 - (absPos * 0.1);
        const zIndex = 100 - absPos;

        card.style.transform = `
            translateX(${translateX}px) 
            translateZ(${translateZ}px) 
            rotateY(${rotateY}deg) 
            scale(${scale})
        `;
        card.style.opacity = Math.max(opacity, 0.3);
        card.style.zIndex = zIndex;
    });
}

function moveCarousel(section, direction) {
    const books = booksData[section];
    carouselState[section].currentIndex =
        (carouselState[section].currentIndex + direction + books.length) % books.length;

    updateCarouselPosition(section);
    resetAutoRotation(section);
}

// Auto Rotation
function startAutoRotation(section) {
    carouselState[section].interval = setInterval(() => {
        moveCarousel(section, 1);
    }, 3000);
}

function resetAutoRotation(section) {
    clearInterval(carouselState[section].interval);
    startAutoRotation(section);
}

// Initialization
async function initializeAll() {
    try {
        const sections = ['gs', 'hs', 'faculty'];

        for (const section of sections) {
            booksData[section] = await fetchNewAcquisitions(section);
            initCarousel(section);
        }

        console.log('All carousels initialized successfully!');
    } catch (error) {
        console.error('Error initializing carousels:', error);
    }
}

window.addEventListener('DOMContentLoaded', initializeAll);
