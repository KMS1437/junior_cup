let map = L.map('map').setView([55.3567, 86.0889], 13);
let tempMarker = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function createMarker(idea) {
    const marker = L.marker([idea.latitude, idea.longitude], {
        icon: customIcon
    });

    const popupContent = `
        <div class="idea-title">${idea.title}</div>
        <div class="idea-description">${idea.description}</div>
    `;

    marker.bindPopup(popupContent, {
        className: 'custom-popup'
    });
    marker.addTo(map);
}

function createIdeaForm(lat, lng) {
    return `
        <div class="idea-form">
            <input type="text" id="idea-title" placeholder="Название идеи" required>
            <textarea id="idea-description" placeholder="Описание идеи" rows="3" required></textarea>
            <div class="form-buttons">
                <button onclick="submitIdea(${lat}, ${lng})">Добавить</button>
                <button onclick="cancelIdea()" class="cancel-btn">Отмена</button>
            </div>
        </div>
    `;
}

function cancelIdea() {
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    map.closePopup();
}

async function submitIdea(lat, lng) {
    const title = document.getElementById('idea-title').value.trim();
    const description = document.getElementById('idea-description').value.trim();

    if (!title || !description) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    const idea = {
        latitude: lat,
        longitude: lng,
        title: title,
        description: description
    };

    try {
        const response = await fetch('/add_idea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(idea)
        });

        if (response.ok) {
            if (tempMarker) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
            map.closePopup();
            loadIdeas();
        } else {
            throw new Error('Ошибка при добавлении идеи');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось добавить идею');
    }
}

function loadIdeas() {
    fetch('ideas.json')
        .then(response => response.json())
        .then(ideas => {
            console.log('Загруженные идеи:', ideas);
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer !== tempMarker) {
                    map.removeLayer(layer);
                }
            });
            ideas.forEach(idea => {
                console.log('Добавление маркера для идеи:', idea);
                createMarker(idea);
            });
        })
        .catch(error => console.error('Ошибка при загрузке идей:', error));
}

map.on('click', function(e) {
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    tempMarker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
    tempMarker.bindPopup(createIdeaForm(lat, lng))
        .openPopup();
});

loadIdeas();

setInterval(loadIdeas, 30000);
