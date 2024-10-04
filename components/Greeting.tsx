// components/Greeting.tsx

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Greeting: React.FC = () => {
  const [greeting, setGreeting] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true); // New loading state
  const [error, setError] = useState<string | null>(null); // State for error handling

  // Fetch greeting from /api/py/hello
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/py/hello');
        if (response.data && response.data.message) {
          setGreeting(response.data.message);
        } else {
          setGreeting("Unknown response format");
        }
      } catch (error) {
        setError("Failed to fetch greeting.");
      } finally {
        setLoading(false); // Set loading to false once the fetch is complete
      }
    };

    fetchGreeting();
  }, []);

  // Render loading state or error state
  if (loading) {
    return <div></div>; // Display loading message
  }

  if (error) {
    return <div>{error}</div>; // Display error message if fetching fails
  }

  return (
    <div>
      <h1>{greeting}</h1> {/* Display the fetched greeting */}
    </div>
  );
};

export default React.memo(Greeting);
