import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faFileUpload, faSpinner } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate to handle navigation
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; // Add this at the top

const Upload = () => {
  const [file, setFile] = useState(null);
  const [command, setCommand] = useState("summarize it"); // Default command
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate for navigating

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleCommandChange = (event) => {
    setCommand(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !command) {
      alert("Please upload a file and enter a command.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("command", command);

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const apiOutput = response.data.output;
      setOutput(
        typeof apiOutput === "string"
          ? apiOutput
          : JSON.stringify(apiOutput, null, 2)
      );
    } catch (error) {
      console.error("Error calling server API:", error);
      if (error.response) {
        setErrorMessage(
          `Error: ${
            error.response.data.error || "An unexpected error occurred."
          }`
        );
      } else {
        setErrorMessage("Network error or timeout.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/search"); // Navigate back to Search component
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-900 via-pink-800 to-green-900 p-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-lg mt-10">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700">
          Upload Your File & Ask a Question
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col space-y-6 p-6 rounded-lg bg-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="flex-1 relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="File Upload"
              />
              <span className="block border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white hover:border-purple-400 transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-600">
                {file ? (
                  <span className="text-gray-800">{file.name}</span>
                ) : (
                  <button className="flex items-center text-blue-600 cursor-pointer">
                    <FontAwesomeIcon
                      icon={faFileUpload}
                      className="mr-2 text-xl"
                    />
                    <span>Upload CSV File</span>
                  </button>
                )}
              </span>
            </label>
          </div>

          <input
            type="text"
            placeholder="Enter your command..."
            value={command}
            onChange={handleCommandChange}
            className="border-2 border-gray-300 p-3 rounded-lg mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <button
            type="submit"
            className="flex items-center justify-center bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            {loading ? (
              <>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                <span>Submit</span>
              </>
            )}
          </button>

          {/* Go Back to Search Button */}
          <button
            type="button"
            onClick={handleGoBack}
            className="mt-4 flex items-center justify-center bg-gray-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-gray-700 transition duration-300 shadow-md"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            <span>Go Back to Search</span>
          </button>
        </form>

        {loading && (
          <div className="mt-6 text-center text-blue-600">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
          </div>
        )}

        {output && (
          <div className="mt-6 p-4 border rounded-lg shadow-lg bg-white">
            <h3 className="text-lg font-semibold text-gray-800">Output:</h3>
            <pre className="whitespace-pre-wrap text-gray-700 bg-gray-100 p-4 rounded-lg">
              {output.replace(/[#*]/g, "")}
            </pre>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 text-center text-red-600">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default Upload;
