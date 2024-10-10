import React, { useState } from 'react';

const Search = () => {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const handleSearch = () => {
        console.log('Searching for coordinates:', { latitude, longitude });
        // Add your search logic here
    };

    return (
        <div>
            <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Latitude..."
            />
            <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Longitude..."
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    );
};

export default Search;