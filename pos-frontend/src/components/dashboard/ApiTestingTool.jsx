import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ApiTestingTool = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const endpoints = [
    { name: 'Sync Database with Frontend', method: 'POST', url: '/api/category/seed' },
    { name: 'Get All Categories', method: 'GET', url: '/api/category' },
    { name: 'Get Menus Data', method: 'GET', url: '/api/menu' }
  ];

  const callEndpoint = async (method, url) => {
    setLoading(true);
    try {
      let response;
      
      if (method === 'GET') {
        response = await axios.get(`http://localhost:8000${url}`);
      } else if (method === 'POST') {
        response = await axios.post(`http://localhost:8000${url}`);
      }
      
      setResult(JSON.stringify(response.data, null, 2));
      toast.success('API call successful');
    } catch (error) {
      console.error('API error:', error);
      setResult(JSON.stringify(error.response?.data || error.message, null, 2));
      toast.error('API call failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-lg">
      <h2 className="text-xl text-white mb-4">API Testing Tool</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {endpoints.map((endpoint, index) => (
          <button
            key={index}
            onClick={() => callEndpoint(endpoint.method, endpoint.url)}
            disabled={loading}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {endpoint.name} ({endpoint.method})
          </button>
        ))}
      </div>
      
      {result && (
        <div className="mt-4">
          <h3 className="text-white mb-2">Response:</h3>
          <pre className="bg-[#2a2a2a] p-4 rounded-md text-green-400 overflow-x-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTestingTool;