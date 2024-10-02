// components/Greeting.tsx

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Greeting: React.FC = () => {
  const [greeting, setGreeting] = useState<string>("");

  // Fetch greeting from /api/py/hello
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/py/hello');
        if (response.data && response.data.message) {
          setGreeting(response.data.message); // Use the `message` field from the response
        } else {
          setGreeting("Unknown response format");
        }
      } catch (error) {
        setGreeting("Failed to fetch greeting.");
      }
    };

    fetchGreeting();
  }, []);

  return (
    <div>
      <h1>{greeting}</h1>
    </div>
  );
};

export default React.memo(Greeting);
