// src/components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect } from 'react';

interface Talk {
  title: string;
  description: string;
  presenter: string;
  sdg_tags: string[];
  similarity_score: number;
  url: string;
}

const LeftPanel: React.FC = () => {
  const [showImage, setShowImage] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Talk[]>([]);
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImage(false);
      console.log("Switched to search panel");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // List of SDGs to display as filters
  const sdgs = [
    "SDG 1 - No Poverty", "SDG 2 - Zero Hunger", "SDG 3 - Good Health and Well-Being",
    "SDG 4 - Quality Education", "SDG 5 - Gender Equality", "SDG 6 - Clean Water and Sanitation",
    "SDG 7 - Affordable and Clean Energy", "SDG 8 - Decent Work and Economic Growth",
    "SDG 9 - Industry, Innovation, and Infrastructure", "SDG 10 - Reduced Inequalities",
    "SDG 11 - Sustainable Cities and Communities", "SDG 12 - Responsible Consumption and Production",
    "SDG 13 - Climate Action", "SDG 14 - Life Below Water", "SDG 15 - Life on Land",
    "SDG 16 - Peace, Justice, and Strong Institutions", "SDG 17 - Partnerships for the Goals"
  ];

  // Function to handle search
  const handleSearch = async () => {
    setError(null); // Clear previous error messages
    setResults([]); // Clear previous results

    try {
      // Use the correct backend URL for your FastAPI server
      let url = `http://127.0.0.1:8000/api/py/search?query=${query}`;
      if (selectedSDGs.length > 0) {
        url += `&sdg_filter=${selectedSDGs.join(",")}`;
      }

      console.log("Request URL:", url); // Debug: Log the request URL

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Search Results:", data); // Debug: Log the response data

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      console.error("Failed to fetch search results:", err);
      setError("Failed to fetch search results. Please try again.");
    }
  };

  // Toggle selected SDGs
  const toggleSDG = (sdg: string) => {
    setSelectedSDGs(selectedSDGs.includes(sdg)
      ? selectedSDGs.filter(s => s !== sdg)
      : [...selectedSDGs, sdg]);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '2em', color: '#fff' }}>Ideas Change Everything!</h1> {/* Updated text color to white */}
      
      {showImage ? (
        <img 
          src="TEDxSDG.jpg" 
          alt="TEDxSDG"
          style={{ height: '100vh', width: 'auto', marginTop: '10px', maxWidth: '100%' }} 
          onLoad={() => console.log("Image loaded successfully")}
          onError={() => console.error("Failed to load the image")}
        />
      ) : (
        <div style={{ margin: '20px' }}>
          <h2>Search TEDx Talks Aligned with SDGs</h2>
          <input
            type="text"
            placeholder="Enter a keyword (e.g., education, health)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '10px', width: '300px', color: '#000', backgroundColor: '#fff' }} // Updated styles for input text visibility
          />
          <button onClick={handleSearch} style={{ padding: '10px 20px', marginLeft: '10px' }}>Search</button>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

          <div style={{ marginTop: '20px' }}>
            <h3>Filter by SDGs:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {sdgs.map(sdg => (
                <label key={sdg} style={{ display: 'block', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    value={sdg}
                    onChange={() => toggleSDG(sdg)}
                    style={{ marginRight: '8px' }}
                  />
                  {sdg}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h3>Results:</h3>
            {results.length > 0 ? (
              results.map((talk, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <h4>{talk.title}</h4>
                  <p><strong>Presenter:</strong> {talk.presenter}</p>
                  <p>{talk.description}</p>
                  <p><strong>SDGs:</strong> {talk.sdg_tags.join(', ')}</p>
                  <a href={talk.url} target="_blank" rel="noopener noreferrer">Watch Talk</a>
                </div>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
