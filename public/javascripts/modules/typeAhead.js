const axios = require('axios');

function searchResultsHTML (stores){
	return stores.map(store => {
		return `
			<a href="/store/${store.slug}" class="search__result">
				<strong>${store.name}</strong>
			</a>
		`;
	}).join('');
}


function typeAhead(search){
	// console.log(search);
	if(!search) return;

	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');

	// console.log(searchInput, searchResults);

	searchInput.on('input', function(){
		// console.log(this.value);
		if(!this.value){
			searchResults.style.display = 'none';
			return;
		}
		searchResults.style.display = 'block';
		// searchResults.innerHTML = '';
		axios
			.get(`/api/search?q=${this.value}`)
			.then(res => {
				// console.log(res.data.length);
				if(res.data.length){
					console.log(searchResults.innerHTML);
					searchResults.innerHTML = searchResultsHTML(res.data);
					return;
				} 
				// nothing to return
				searchResults.innerHTML = `<div class ="search__result"> No results for ${this.value} found! <div>`;
			})
			.catch(err => {
				console.error(error);
			});
	});

	searchInput.on('keyup', (e) => {

		// only for pressing up, down and enter
		if(![38,40,13].includes(e.keyCode)){
			return;
		}
		// console.log(e.keyCode);
		const activeClass = "search__result--active";
		const current = search.querySelector(`.${activeClass}`);
		const items = search.querySelectorAll(`.search__result`);
		let next;
		if(e.keyCode === 40 && current){
			next = current.nextElementSibling || items[0];
		} else if (e.keyCode === 40){
			next = items[0];
		} else if(e.keyCode === 38 && current){
			next = current.previousElementSibling || items[items.length -1];
		} else if(e.keyCode === 38){
			next = items[items.length -1];
		} else if(e.keyCode === 13 && current.href){
			window.location = current.href;
			return;
		}
		if(current){
			current.classList.remove(activeClass);	
		}
		next.classList.add(activeClass);
		console.log(current);
	});
}

export default typeAhead;
