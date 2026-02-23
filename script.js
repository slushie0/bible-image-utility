let verseText = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.";
let verseReference = "John 3:16";

function loadVerse() {
    const verse = document.querySelector('#verse-input').value;
    console.log(`Generating image for verse: ${verse}`);

    fetch(`https://bible-api.com/${encodeURIComponent(verse)}?translation=kjv`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            verseText = data.text;
            verseReference = data.reference;
            drawImageWithText();
        })
        .catch(error => {
            console.error('Error fetching verse:', error);
        });
}

function drawImageWithText() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('image-input');
    const fontSize = parseInt(document.getElementById("font-size").value);
    const color = document.getElementById("text-color").value;
    const align = document.getElementById("text-align").value;

    if (!fileInput.files.length) {
        //alert("Select a background image first.");
        //return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Get user-selected aspect ratio
            const aspectRatioSelect = document.getElementById('aspect-ratio').value;
            
            // Map aspect ratio to width:height ratio
            const ratioMap = {
                'default': img.naturalWidth / img.naturalHeight, // Original image ratio
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
            const Xo = img.naturalWidth;
            const Yo = img.naturalHeight;
            
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
            ctx.drawImage(img, offsetX, offsetY, Xd, Yd, 0, 0, Xd, Yd);

            // Draw verse text
            ctx.font = `${fontSize}px serif`;
            ctx.fillStyle = color;
            ctx.textAlign = align;

            ctx.shadowColor = "black";
            ctx.shadowBlur = fontSize / 6;

            const includeSubtitle = document.getElementById('include-subtitle').checked;
            let textY = canvas.height / 2;
            if (includeSubtitle && verseReference) {
                // Adjust Y position to make room for subtitle
                textY -= fontSize * 0.3; // Move main text up a bit
            }

            const lines = wrapText(ctx, verseText, canvas.width / 2, textY, canvas.width * 0.8, fontSize * 1.2);

            // Draw subtitle if checked
            if (includeSubtitle && verseReference) {
                ctx.font = `${fontSize * 0.5}px serif`; // Smaller font for subtitle
                ctx.shadowBlur = fontSize / 12; // Smaller shadow
                const subtitleY = textY + (lines * fontSize * 1.2) / 2 + fontSize * 0.6; // Below the main text
                ctx.fillText(verseReference, canvas.width / 2, subtitleY);
            }
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
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

document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", drawImageWithText);
});

document.getElementById("fullscreen-btn").addEventListener("click", () => {
    const canvas = document.getElementById("canvas");

    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});