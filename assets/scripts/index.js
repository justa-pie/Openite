const starsContainer = document.getElementById('stars');
const allStars = [];

// Generate stars
for (let i = 0; i < 200; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
    allStars.push(star);
}

// Three.js Tubes Cursor Effect
import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"

const app = TubesCursor(document.getElementById('canvas'), {
    tubes: {
        colors: ["#f967fb", "#53bc28", "#6958d5"],
        lights: {
            intensity: 200,
            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
        }
    }
});

// Helper for randomizing colors on click
function randomColors(count) {
    return Array.from({ length: count }, () => '#' + Math.floor(Math.random()*16777215).toString(16));
}

document.body.addEventListener('click', () => {
    const colors = randomColors(3);
    const lightsColors = randomColors(4);
    app.updateConfig({
        tubes: {
            colors: colors,
            lights: { colors: lightsColors }
        }
    });
});