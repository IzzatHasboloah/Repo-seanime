// 9anime Extension Code

// This is a hypothetical example of what a 9anime extension might look like.
// It is designed to fetch and display anime content from the 9anime API.

const axios = require('axios');

class NineAnime {
    constructor() {
        this.baseUrl = 'https://9anime.to/api/v1';
    }

    async fetchAnimeList() {
        try {
            const response = await axios.get(`${this.baseUrl}/anime`);
            return response.data;
        } catch (error) {
            console.error('Error fetching anime list:', error);
            throw error;
        }
    }

    async fetchAnimeDetails(animeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/anime/${animeId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching anime details:', error);
            throw error;
        }
    }
}

// Usage
const nineAnime = new NineAnime();

nineAnime.fetchAnimeList().then(animeList => {
    console.log('Anime List:', animeList);
});

// You can fetch details of a specific anime by passing its ID.
// nineAnime.fetchAnimeDetails('1').then(animeDetails => console.log(animeDetails));
