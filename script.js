let verseText = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.";
let verseReference = "John 3:16";
let loadedImage = null; // Cache for the loaded image

function loadVerse() {
    const verse = document.querySelector('#verse-input').value;
    console.log(`Generating image for verse: ${verse}`);

    fetch(`https://bible-api.com/${encodeURIComponent(verse)}?translation=kjv`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            verseText = data.text;
            verseReference = data.reference;
            drawTextOnImage();
        })
        .catch(error => {
            console.error('Error fetching verse:', error);
        });
}

function loadImage() {
    const fileInput = document.getElementById('image-input');
    
    if (!fileInput.files.length) {
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            loadedImage = img; // Cache the loaded image
            drawTextOnImage(); // Draw text after image is loaded
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

function drawTextOnImage() {
    if (!loadedImage) {
        return; // No image loaded yet
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = parseInt(document.getElementById("font-size").value);
    const color = document.getElementById("text-color").value;
    const textAlign = document.getElementById("text-align").value;
    const verAlign = Number(document.getElementById("vertical-align").value)/200*canvas.height;

    // Get user-selected aspect ratio
    const aspectRatioSelect = document.getElementById('aspect-ratio').value;
    
    // Map aspect ratio to width:height ratio
    const ratioMap = {
        'default': loadedImage.naturalWidth / loadedImage.naturalHeight, // Original image ratio
        'phone-portrait': 9 / 16,
        'phone-landscape': 16 / 9,
        'desktop': 16 / 10,
        'square': 1 / 1,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '3:2': 3 / 2,
        '2:3': 2 / 3
    };
    
    const r = ratioMap[aspectRatioSelect] || 1;
    
    // Original image dimensions
    const Xo = loadedImage.naturalWidth;
    const Yo = loadedImage.naturalHeight;
    
    // Calculate canvas dimensions to fit within image, maximizing size
    const Xd = Math.min(Xo, Yo * r);
    const Yd = Xd / r;
    
    // Set canvas to calculated dimensions
    canvas.width = Xd;
    canvas.height = Yd;
    
    // Calculate offsets to center the crop on the original image
    const offsetX = (Xo - Xd) / 2;
    const offsetY = (Yo - Yd) / 2;
    
    // Clear and draw the cropped image without scaling
    ctx.clearRect(0, 0, Xd, Yd);
    ctx.drawImage(loadedImage, offsetX, offsetY, Xd, Yd, 0, 0, Xd, Yd);

    // Draw verse text
    console.log(fontSize)
    ctx.font = `${fontSize}px ${font.value}`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;

    ctx.shadowColor = "black";
    ctx.shadowBlur = fontSize / 6;

    const includeSubtitle = document.getElementById('include-subtitle').checked;
    let textY = canvas.height / 2;
    if (includeSubtitle && verseReference) {
        // Adjust Y position to make room for subtitle
        textY -= fontSize * 0.3; // Move main text up a bit
    }

    const lines = wrapText(ctx, verseText, canvas.width / 2, textY + verAlign, canvas.width * 0.8, fontSize * 1.2);

    // Draw subtitle if checked
    if (includeSubtitle && verseReference) {
        ctx.font = `${fontSize * 0.5}px ${font.value}`; // Smaller font for subtitle
        ctx.shadowBlur = fontSize / 12; // Smaller shadow
        const subtitleY = textY + verAlign + (lines * fontSize * 1.2) / 2 + fontSize * 0.6; // Below the main text
        ctx.fillText(verseReference, canvas.width / 2, subtitleY);
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    // Step 1: Split into lines
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    // Step 2: Calculate total height
    const totalHeight = lines.length * lineHeight;

    // Step 3: Calculate starting Y to center vertically
    let startY = y - totalHeight / 2 + lineHeight / 2;

    // Step 4: Draw each line
    lines.forEach((ln, index) => {
        ctx.fillText(ln, x, startY + index * lineHeight);
    });

    return lines.length;
}

document.getElementById('download-btn').addEventListener('click', () => {
    const canvas = document.getElementById('canvas');

    // Convert canvas to image data
    const imageURL = canvas.toDataURL("image/png");

    // Create a temporary link
    const link = document.createElement('a');
    link.href = imageURL;
    const verse = document.querySelector('#verse-input').value.replace(/\s+/g, '_');
    link.download = `${verse}.png`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Set up event listeners
document.getElementById('image-input').addEventListener('change', loadImage);

document.querySelectorAll("input:not(#image-input), select").forEach(el => {
    el.addEventListener("input", drawTextOnImage);
});

document.getElementById("fullscreen-btn").addEventListener("click", () => {
    const canvas = document.getElementById("canvas");

    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// Modal functionality
const modal = document.getElementById("image-modal");
const defaultImagesBtn = document.getElementById("default-images-btn");
const closeBtn = document.getElementsByClassName("close")[0];

defaultImagesBtn.onclick = function() {
    modal.style.display = "block";
}

closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function selectDefaultImage(url) {
    const img = new Image();
    img.onload = function() {
        loadedImage = img;
        drawTextOnImage();
        modal.style.display = "none";
    };
    img.src = url;
}