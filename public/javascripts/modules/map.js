import axios from 'axios';

import {$, $$} from './bling';

const mapOptions = {
	center: { lat: 43.2, lng:-79.8},
	zoom: 10
};

function loadPlaces(map, lat= 43.2, lng=-79.8){
	axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
		.then( res => {
			const places = res.data;
			if(!places.length){
				alert ('no places found');
				return;
			}

			// create bounds
			const bounds = new google.maps.LatLngBounds(); // bounds is for displaying the markers at the very center of the map (in group)

			const inforWindow = new google.maps.InfoWindow();

			const markers = places.map( place => {
				const [placeLng, placeLat] =place.location.coordinates; // array destruction				
				// console.log(placeLng, placeLat);
				const position = {lat: placeLat, lng: placeLng};
				
				bounds.extend(position);

				const marker = new google.maps.Marker({ map, position});
				marker.place = place;
				return marker;
			});
			// console.log(markers);

			// whem a marker is clicked show details of the place
			markers.forEach(marker => marker.addListener('click', function(){
				console.log(this.place);
				const html = `
					<div>
						<a href="/store/${this.place.slug}">
							<img src="/uploads/${this.place.photo || 'store.png'}" alt = "${this.place.name}"/> 
							<p>${this.place.name} - ${this.place.location.address}</p>
						</a>
					</div>
				`;

				inforWindow.setContent(html);
				inforWindow.open(map, this);
			}));

			// zoom map according places to show them all at once and centered
			map.setCenter(bounds.getCenter());
			map.fitBounds(bounds);
		});
}

// navigator.geolocation.getCurrentPosition

function makeMap(mapDiv){
	if(!mapDiv) return;
	/// make our map
	const map = new google.maps.Map(mapDiv, mapOptions);
	loadPlaces(map);

	const input = $('[name="geolocate"]');
	const autocomplete = new google.maps.places.Autocomplete(input);

	// console.log(input);
	autocomplete.addListener( 'place_changed', () => {
		const place =autocomplete.getPlace();
		console.log(place);
		loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
	});
}

export default makeMap;
