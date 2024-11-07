import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faCheck, faLink } from '@fortawesome/free-solid-svg-icons';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { faAtom, faHeartbeat, faMoon, faCloudSun, faBrain, faShieldAlt, faRobot, faCity, faPrint, faCode, faMap, faMicroscope, faCogs, faSitemap, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';

const Search = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [numPages, setNumPages] = useState(100);
  const [pageCap, setPageCap] = useState(1000);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [sampleTopics, setSampleTopics] = useState([]);

  const allSampleTopics = [
    { name: "Climate Change", icon: faCloudSun },
    { name: "Artificial Intelligence", icon: faBrain },
    { name: "Quantum Computing", icon: faAtom },
    { name: "Space Exploration", icon: faMoon },
    { name: "Renewable Energy", icon: faCloudSun },
    { name: "Genetic Engineering", icon: faMicroscope },
    { name: "Blockchain Technology", icon: faLink },
    { name: "Cybersecurity", icon: faShieldAlt },
    { name: "Robotic Automation", icon: faRobot },
    { name: "Artificial Life", icon: faBrain },
    { name: "Quantum Physics", icon: faAtom },
    { name: "Genetic Algorithms", icon: faCogs },
    { name: "Cybercrime", icon: faShieldAlt },
    { name: "Augmented Reality", icon: faSitemap },
    { name: "Mental Health", icon: faHeartbeat },
    { name: "Biotechnology", icon: faMicroscope },
    { name: "Nanotechnology", icon: faAtom },
    { name: "Smart Cities", icon: faCity },
    { name: "3D Printing", icon: faPrint },
    { name: "Internet of Things", icon: faCode },
    { name: "Sustainable Agriculture", icon: faHandHoldingHeart },
    { name: "Data Science", icon: faDatabase },
    { name: "Telemedicine", icon: faHeartbeat },
    { name: "Financial Technology", icon: faShieldAlt },
    { name: "Bioinformatics", icon: faDatabase },
    { name: "Virtual Reality", icon: faCogs },
    { name: "Robotics", icon: faRobot },
    { name: "Machine Learning", icon: faBrain }
  ];

  useEffect(() => {
    const getRandomSamples = () => {
      const shuffled = [...allSampleTopics].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 8);
    };
    setSampleTopics(getRandomSamples());
  }, []);

  const handleSearch = async () => {
    if (!topic) {
      setError("Topic cannot be empty.");
      return;
    }

    if (![100, 200, 300, 500, 1000].includes(numPages)) {
      setError("Number of articles must be one of the following: 100, 200, 300, 500, or 1000.");
      return;
    }

    if (pageCap < 1) {
      setError("Capping must be at least 1.");
      return;
    }

    setLoading(true);
    setError(null);
    setCompleted(false);

    try {
      const response = await axios.post("http://localhost:3000/search", { topic, numPages, pageCap });
      setResult(response.data.map((article) => ({ ...article, showFullContent: false })));
      setCompleted(true);
    } catch (error) {
      setError("Failed to fetch results. Please try again.");
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  const getContentWithCapping = (content) => {
    if (!content || typeof content !== "string") return "";
    return content.length > pageCap ? content.slice(0, pageCap) + "..." : content;
  };

  const handleDownloadAndRedirect = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/download-csv?search=${topic}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${topic}.csv`;
      downloadLink.click();
      navigate('/upload');
    } catch (error) {
      console.error("Error downloading the CSV:", error);
      setError("Failed to download CSV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateCSVData = () => {
    const headers = ['Title', 'Content', 'Source'];
    const rows = result.map((article) => [
      article.Title,
      article.Content,
      article.Source
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n';

    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-900 via-pink-800 to-green-900 p-4">
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-xl border border-gray-200 overflow-y-auto">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Web Scraper</h2>

        <div className="flex flex-col gap-6">
          <div className="flex items-center mb-4">
            <label htmlFor="topic" className="text-base font-medium text-gray-700 mr-2">Topic:</label>
            <div className="relative flex-grow">
              <input
                type="text"
                id="topic"
                className="border border-gray-300 p-3 rounded-lg bg-gray-50 pl-10 w-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                placeholder="Enter Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:gFrid-cols-4 gap-4 mb-6">
            {sampleTopics.map(({ name, icon }) => (
              <button
                key={name}
                onClick={() => setTopic(name)}
                className="border border-blue-500 p-3 rounded-lg bg-blue-100 hover:bg-blue-200 transition duration-300 w-full text-sm md:text-base flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={icon} />
                {name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-start mb-6">
            <label className="text-base font-medium text-gray-700 mr-2">No of Articles:</label>
            <div className="flex flex-wrap gap-3">
              {[100, 200, 300, 500, 1000].map((num) => (
                <button
                  key={num}
                  className={`flex-1 min-w-[120px] border border-gray-300 p-3 rounded-lg font-semibold transition duration-300 ${num === numPages ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setNumPages(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center mb-6">
            <label htmlFor="pageCap" className="text-base font-medium text-gray-700 mr-1">Capping:</label>
            <input
              type="number"
              id="pageCap"
              className="border border-gray-300 p-3 rounded-lg bg-gray-50 w-3/4 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              value={pageCap}
              onChange={(e) => setPageCap(Number(e.target.value))}
              min={1}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-4 mt-3">
            <button
              onClick={handleSearch}
              className="w-full border border-blue-500 p-3 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition duration-300 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <img src="https://aceyourpaper.com/essays/public/images/loader.gif" alt="Loading" className="w-6 h-6 inline" />
              ) : completed ? (
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
              )}
              {loading ? " Searching..." : completed ? " Completed" : " Search"}
            </button>

            {result.length > 0 && (
              <div className="flex justify-center mt-6">
                <a
                  href={generateCSVData()}
                  download={`${topic}.csv`}
                  className="w-full flex items-center border border-green-500 p-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition duration-300 shadow-md"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download Your CSV Report Here
                </a>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}

          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate("/upload")}
              className="w-full border border-blue-500 p-3 rounded-lg bg-green-900 text-white font-semibold hover:bg-green-700 transition duration-300 shadow-lg"
            >
              <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2" />
              Already have a file? Upload Now
            </button>
          </div>

          {result.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">Search Results:</h3>
              <ul className="space-y-4">
                {result.map((article, index) => (
                  <li key={index} className="border-b border-gray-300 pb-4">
                    <h4 className="text-lg font-semibold">{article.Title}</h4>
                    <p>{getContentWithCapping(article.Content)}</p>
                    <a href={article.Source} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Read More</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
